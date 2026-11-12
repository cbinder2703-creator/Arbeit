import { useEffect, useMemo, useRef, useState } from 'react';
import type { ModeProps } from '../types';
import { shuffle } from '@/engine/shuffle';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { Icon } from '@/ui/Icon';
import { Button } from '@/ui/Button';
import { ChapterChip } from '@/ui/ChapterChip';
import { playSound } from '@/ui/sound';

const PAIRS = 6;
const MAX_FLASHCARD_DEF = 70; // längere Definitionen passen nicht lesbar auf eine Karte

interface Card {
  id: number;
  pairId: number;
  side: 'l' | 'r';
  text: string;
  source: string;
}

/** Schriftgröße je nach Textlänge – damit auch lange Begriffe auf die kleine Karte passen */
const sizeFor = (t: string) => (t.length <= 8 ? 16 : t.length <= 12 ? 14 : t.length <= 24 ? 13 : t.length <= 40 ? 11.5 : 10.5);

function Board({ items, flashcards = [], onAnswer, onFinish, onClose }: ModeProps) {
  const pairs = useMemo(() => {
    const list: { left: string; right: string; source: string }[] = [];
    for (const it of items) {
      if (it.type !== 'pairs') continue;
      for (const p of it.pairs) if (list.length < PAIRS) list.push({ ...p, source: it.id });
    }
    if (list.length < PAIRS) {
      const short = [...flashcards].filter((f) => f.definition.length <= MAX_FLASHCARD_DEF).sort((a, b) => a.definition.length - b.definition.length);
      for (const f of short) if (list.length < PAIRS) list.push({ left: f.term, right: f.definition, source: f.id });
    }
    return list;
  }, [items, flashcards]);

  const deck = useMemo<Card[]>(
    () =>
      shuffle(
        pairs.flatMap((p, i) => [
          { pairId: i, side: 'l' as const, text: p.left, source: p.source },
          { pairId: i, side: 'r' as const, text: p.right, source: p.source },
        ]),
      ).map((c, id) => ({ ...c, id })),
    [pairs],
  );

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const [lock, setLock] = useState(false);
  const [secs, setSecs] = useState(0);
  const start = useRef(Date.now());
  const finished = useRef(false);

  const allDone = matched.size === pairs.length && pairs.length > 0;

  useEffect(() => {
    if (allDone) return;
    const t = setInterval(() => setSecs(Math.floor((Date.now() - start.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [allDone]);

  const finish = (finalMoves: number, finalMissed: Set<string>) => {
    if (finished.current) return;
    finished.current = true;
    const timeMs = Date.now() - start.current;
    const sources = [...new Set(pairs.map((p) => p.source))];
    for (const s of sources) {
      const total = pairs.filter((p) => p.source === s).length;
      const clean = !finalMissed.has(s);
      onAnswer({ itemId: s, correct: clean, timeMs, parts: { total, correct: clean ? total : Math.max(0, total - 1), errors: 0 } });
    }
    const seconds = Math.round(timeMs / 1000);
    setTimeout(
      () =>
        onFinish({
          score: 0,
          maxScore: pairs.length * 100,
          stats: [
            { key: 'zuege', value: finalMoves, label: `${finalMoves} Züge` },
            { key: 'zeit', value: seconds, label: `${seconds} s` },
          ],
        }),
      900,
    );
  };

  const flip = (c: Card) => {
    if (lock || matched.has(c.pairId) || flipped.includes(c.id) || flipped.length >= 2) return;
    playSound('flip');
    const now = [...flipped, c.id];
    setFlipped(now);
    if (now.length < 2) return;
    const [a, b] = now.map((id) => deck[id]);
    const m = moves + 1;
    setMoves(m);
    if (a.pairId === b.pairId && a.side !== b.side) {
      const nm = new Set(matched).add(a.pairId);
      setTimeout(() => {
        playSound('correct');
        setMatched(nm);
        setFlipped([]);
        if (nm.size === pairs.length) finish(m, missed);
      }, 450);
    } else {
      const nmiss = new Set(missed).add(a.source).add(b.source);
      setMissed(nmiss);
      setLock(true);
      setTimeout(() => {
        playSound('wrong');
        setFlipped([]);
        setLock(false);
      }, 1000);
    }
  };

  return (
    <ModeFrame>
      <ModeHeader
        onClose={onClose}
        current={matched.size}
        total={pairs.length}
        title="Memory"
        right={
          <span className="shrink-0 text-xs font-semibold text-mute" aria-live="polite">
            {moves} Züge · {secs} s
          </span>
        }
      />
      <div className="flex-1 px-4 pb-8">
        <p className="mb-3 text-sm text-mute">Finde zu jedem Begriff die passende Erklärung – Karten antippen und umdrehen.</p>
        <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 md:gap-3" role="group" aria-label="Memory-Karten">
          {deck.map((c) => {
            const isMatched = matched.has(c.pairId);
            const up = isMatched || flipped.includes(c.id);
            const bad = up && !isMatched && flipped.length === 2 && lock;
            return (
              <button
                key={c.id}
                onClick={() => flip(c)}
                aria-label={up ? c.text : `Karte ${c.id + 1}, verdeckt`}
                aria-pressed={up}
                data-testid={`card-${c.id}`}
                data-pair={c.pairId}
                data-state={isMatched ? 'matched' : up ? 'up' : 'down'}
                className="no-select group relative aspect-[3/4] min-h-[96px] w-full [perspective:800px] md:aspect-[4/3]"
              >
                <span
                  className="absolute inset-0 transition-transform duration-300 [transform-style:preserve-3d]"
                  style={{ transform: up ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                  <span className="pattern-bg absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br from-p to-[var(--p-dark)] [backface-visibility:hidden]">
                    <Icon name="sparkles" size={26} className="text-white/70" />
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center justify-center rounded-2xl border-2 p-1.5 text-center font-semibold leading-tight [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                      isMatched ? 'border-good bg-good/15 text-good' : bad ? 'border-bad bg-bad/15' : 'border-line bg-card-hi'
                    }`}
                    style={{ fontSize: sizeFor(c.text), hyphens: 'auto', overflowWrap: 'anywhere' }}
                    lang="de"
                  >
                    {c.text}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {allDone && (
          <p role="status" className="mt-5 text-center font-display text-xl text-good">
            Alle Paare gefunden – {moves} Züge!
          </p>
        )}
      </div>
    </ModeFrame>
  );
}

const LINK_COLORS = ['#F97316', '#3B82F6', '#10B981', '#A855F7', '#EAB308', '#EC4899', '#06B6D4', '#84CC16'];

/** Abschlussprüfung: Paare zuordnen (statt Karten umdrehen) – kein Feedback, Antwort wird nur festgehalten */
function MatchExam({ items, onAnswer, onFinish, onClose, exam }: ModeProps) {
  const item = items[0];
  if (item.type !== 'pairs') throw new Error('Memory braucht pairs-Aufgaben');
  const rights = useMemo(() => shuffle(item.pairs.map((p, i) => ({ text: p.right, pair: i }))), [item]);
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [links, setLinks] = useState<Record<number, number>>({}); // links-Index → rights-Index
  const start = useRef(Date.now());
  const linkedRights = new Set(Object.values(links));
  const colorOfLeft = (l: number) => LINK_COLORS[l % LINK_COLORS.length];
  const leftOfRight = (r: number) => Object.entries(links).find(([, v]) => v === r)?.[0];

  const pickRight = (r: number) => {
    if (selLeft === null) return;
    setLinks((cur) => {
      const n = { ...cur };
      for (const [k, v] of Object.entries(n)) if (v === r) delete n[Number(k)];
      n[selLeft] = r;
      return n;
    });
    setSelLeft(null);
  };
  const done = Object.keys(links).length === item.pairs.length;
  const commit = () => {
    const correct = item.pairs.filter((_, l) => rights[links[l]]?.pair === l).length;
    onAnswer({ itemId: item.id, correct: correct === item.pairs.length, timeMs: Date.now() - start.current, parts: { total: item.pairs.length, correct, errors: 0 } });
    onFinish({ score: 0, maxScore: 0 });
  };

  return (
    <ModeFrame>
      <ModeHeader onClose={onClose} current={0} total={1} exam={exam} />
      <div className="flex-1 px-4 pb-8">
        <ChapterChip chapter={item.chapter} />
        <h1 className="mt-2 font-display text-[22px] leading-tight">{item.question}</h1>
        <p className="mt-1 text-sm text-mute">Links einen Begriff antippen, dann rechts die passende Erklärung.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <ul className="space-y-2" aria-label="Begriffe">
            {item.pairs.map((p, l) => (
              <li key={l}>
                <button
                  onClick={() => setSelLeft(l)}
                  aria-pressed={selLeft === l}
                  data-testid={`left-${l}`}
                  className="tap flex w-full items-center gap-2 rounded-xl border-2 bg-card px-2.5 py-2 text-left text-[14px] leading-tight"
                  style={{ borderColor: selLeft === l ? '#FACC15' : links[l] !== undefined ? colorOfLeft(l) : '#2A3352' }}
                >
                  {links[l] !== undefined && <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorOfLeft(l) }} aria-hidden="true" />}
                  <span className="min-w-0 break-words" lang="de" style={{ hyphens: 'auto' }}>{p.left}</span>
                </button>
              </li>
            ))}
          </ul>
          <ul className="space-y-2" aria-label="Erklärungen">
            {rights.map((r, i) => {
              const l = leftOfRight(i);
              return (
                <li key={i}>
                  <button
                    onClick={() => pickRight(i)}
                    disabled={selLeft === null}
                    data-testid={`right-${i}`}
                    className="tap flex w-full items-center gap-2 rounded-xl border-2 bg-card px-2.5 py-2 text-left text-[14px] leading-tight disabled:opacity-100"
                    style={{ borderColor: l !== undefined ? colorOfLeft(Number(l)) : '#2A3352' }}
                  >
                    {l !== undefined && <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorOfLeft(Number(l)) }} aria-hidden="true" />}
                    <span className="min-w-0 break-words" lang="de" style={{ hyphens: 'auto' }}>{r.text}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <Button variant="theme" block className="mt-5" disabled={!done || !linkedRights.size} onClick={commit}>
          Weiter
        </Button>
      </div>
    </ModeFrame>
  );
}

export default function Game(props: ModeProps) {
  return props.exam ? <MatchExam {...props} /> : <Board {...props} />;
}
