import { useMemo, useRef, useState } from 'react';
import type { ModeProps, PlayItem } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { ChapterChip } from '@/ui/ChapterChip';
import { Confetti } from '@/ui/Confetti';
import { Icon } from '@/ui/Icon';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';

type MC = Extract<PlayItem, { type: 'mc' }>;

export const LADDER = [50, 100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 500000, 1000000];
/** Sicherheitsstufen: nach der 5. und 10. Frage ist der Betrag sicher */
export const SAFE = [4, 9];
const fmt = (n: number) => n.toLocaleString('de-DE');

/** Betrag, den man mitnimmt, wenn man bei Frage `level` (0-basiert) falsch antwortet */
export const guaranteed = (level: number): number => (level > SAFE[1] ? LADDER[SAFE[1]] : level > SAFE[0] ? LADDER[SAFE[0]] : 0);
/** Betrag beim freiwilligen Aussteigen vor Frage `level` */
export const walkAway = (level: number): number => (level > 0 ? LADDER[level - 1] : 0);

const shuffled = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5);

/** Publikumsjoker: verteilt 100 % auf die sichtbaren Antworten – die richtige bekommt meist am meisten */
export function audienceVotes(visible: number[], correct: number, difficulty: number, fiftyUsed: boolean): Record<number, number> {
  const lo = difficulty === 1 ? 50 : difficulty === 2 ? 40 : 30;
  let top = lo + Math.floor(Math.random() * 25) + (fiftyUsed ? 15 : 0);
  top = Math.min(92, top);
  const wrong = visible.filter((i) => i !== correct);
  const out: Record<number, number> = { [correct]: top };
  let rest = 100 - top;
  wrong.forEach((w, k) => {
    const share = k === wrong.length - 1 ? rest : Math.floor(Math.random() * rest * 0.8);
    out[w] = share;
    rest -= share;
  });
  return out;
}

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const all = useMemo(() => items.filter((i): i is MC => i.type === 'mc'), [items]);
  // 15 Fragen – nach Schwierigkeit aufsteigend; der Rest sind Ersatzfragen
  const main = useMemo(
    () => all.slice(0, 15).map((q, i) => ({ q, i })).sort((a, b) => a.q.difficulty - b.q.difficulty || a.i - b.i).map((x) => x.q),
    [all],
  );
  const spare = useRef<MC[]>(all.slice(15));
  const total = main.length;

  const [qs, setQs] = useState<MC[]>(main);
  const [level, setLevel] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [hidden, setHidden] = useState<number[]>([]);
  const [votes, setVotes] = useState<Record<number, number> | null>(null);
  const [used, setUsed] = useState({ fifty: false, audience: false, swap: false });
  const [end, setEnd] = useState<{ amount: number; million: boolean; walked: boolean } | null>(null);
  const totalRef = useRef(score);
  const start = useRef(Date.now());

  const q = qs[level];
  const correct = locked && picked === q.correct;
  const resetQuestion = () => {
    setPicked(null);
    setLocked(false);
    setRes(null);
    setHidden([]);
    setVotes(null);
    start.current = Date.now();
  };

  const select = (i: number) => {
    if (locked || hidden.includes(i)) return;
    playSound('tap');
    setPicked(i);
  };
  const lock = () => {
    if (picked === null || locked) return;
    const ok = picked === q.correct;
    const r = onAnswer({ itemId: q.id, correct: ok, timeMs: Date.now() - start.current });
    totalRef.current = r.total;
    playSound(ok ? 'correct' : 'wrong');
    setRes(r);
    setLocked(true);
  };
  const next = () => {
    if (correct) {
      if (level + 1 >= total) return setEnd({ amount: LADDER[Math.min(level, LADDER.length - 1)], million: true, walked: false });
      setLevel(level + 1);
      resetQuestion();
    } else setEnd({ amount: guaranteed(level), million: false, walked: false });
  };
  const walk = () => setEnd({ amount: walkAway(level), million: false, walked: true });

  const useFifty = () => {
    if (used.fifty || locked) return;
    const wrongs = shuffled([0, 1, 2, 3].filter((i) => i < q.options.length && i !== q.correct));
    setHidden(wrongs.slice(0, 2));
    if (picked !== null && wrongs.slice(0, 2).includes(picked)) setPicked(null);
    setUsed((u) => ({ ...u, fifty: true }));
    setVotes(null);
  };
  const useAudience = () => {
    if (used.audience || locked) return;
    const visible = q.options.map((_, i) => i).filter((i) => !hidden.includes(i));
    setVotes(audienceVotes(visible, q.correct, q.difficulty, used.fifty));
    setUsed((u) => ({ ...u, audience: true }));
  };
  const useSwap = () => {
    if (used.swap || locked || spare.current.length === 0) return;
    const fresh = spare.current.shift()!;
    setQs((cur) => cur.map((x, i) => (i === level ? fresh : x)));
    setUsed((u) => ({ ...u, swap: true }));
    resetQuestion();
  };

  useKeys((e) => {
    const k = e.key.toLowerCase();
    const n = '1234'.indexOf(k) >= 0 ? Number(k) - 1 : 'abcd'.indexOf(k);
    if (n >= 0 && n < q.options.length) select(n);
    if (e.key === 'Enter' && !locked) {
      e.preventDefault();
      lock();
    }
  }, !end);

  if (end) {
    return (
      <ModeFrame>
        {end.million && <Confetti count={70} />}
        <div className="grid flex-1 place-items-center px-6 text-center" data-testid="end">
          <div>
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-xp/20 text-xp">
              <Icon name="trophy" size={44} />
            </span>
            <h1 className="mt-4 text-3xl">{end.million ? 'Du bist Azubionär!' : end.walked ? 'Clever ausgestiegen!' : end.amount > 0 ? 'Leider falsch – aber nicht leer aus' : 'Leider falsch'}</h1>
            <p className="mt-2 font-display text-5xl text-xp" data-testid="amount">{fmt(end.amount)} Taler</p>
            <p className="mt-2 text-mute">
              {end.million ? 'Alle 15 Fragen richtig!' : end.walked ? `Du hast bei Frage ${level + 1} aufgehört und nimmst den Gewinn mit.` : end.amount > 0 ? 'Die Sicherheitsstufe hat dir den Betrag gerettet.' : 'Vor der ersten Sicherheitsstufe gibt es keinen Gewinn.'}
            </p>
            <Button className="mt-6" onClick={() => onFinish({ score: totalRef.current, maxScore: total * 100 })}>
              Ergebnis ansehen
            </Button>
          </div>
        </div>
      </ModeFrame>
    );
  }

  const visible = (i: number) => !hidden.includes(i);
  return (
    <ModeFrame padBottom={locked}>
      <ModeHeader onClose={onClose} current={level + (locked ? 1 : 0)} total={total} score={score} title="Azubionär" lookup={itemText(q)} />
      <div className="flex-1 px-4 pb-6">
        {/* Gewinnleiter als scrollbare Leiste */}
        <ol className="scroll-hide -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-2" aria-label="Gewinnleiter">
          {LADDER.slice(0, total).map((v, i) => (
            <li
              key={i}
              aria-current={i === level ? 'step' : undefined}
              className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${
                i === level ? 'bg-xp text-[#1a1400]' : i < level ? 'bg-good/20 text-good' : SAFE.includes(i) ? 'border border-xp/60 text-xp' : 'bg-card-hi text-mute'
              }`}
            >
              {fmt(v)}
            </li>
          ))}
        </ol>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <ChapterChip chapter={q.chapter} />
          <Chip color="#EAB308">
            Frage {level + 1} · {fmt(LADDER[level])} Taler
          </Chip>
        </div>

        <h1 className="mt-3 font-display text-[22px] leading-snug lg:text-3xl" data-testid="question">{q.question}</h1>

        {/* Joker */}
        <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label="Joker">
          <Button variant="secondary" disabled={used.fifty || locked} onClick={useFifty} className="!px-2 text-sm" aria-label="Joker 50:50">50:50</Button>
          <Button variant="secondary" disabled={used.audience || locked} onClick={useAudience} className="!px-2 text-sm" aria-label="Joker Publikum">
            <Icon name="users" size={16} /> Publikum
          </Button>
          <Button variant="secondary" disabled={used.swap || locked || spare.current.length === 0} onClick={useSwap} className="!px-2 text-sm" aria-label="Joker Frage tauschen">
            <Icon name="reset" size={16} /> Tauschen
          </Button>
        </div>

        <div className="mt-4 grid gap-2.5 md:grid-cols-2" role="group" aria-label="Antworten">
          {q.options.map((o, i) => {
            const gone = !visible(i);
            const state = gone ? 'gone' : !locked ? (picked === i ? 'sel' : 'idle') : i === q.correct ? 'right' : i === picked ? 'wrong' : 'dim';
            return (
              <button
                key={i}
                onClick={() => select(i)}
                disabled={gone || locked}
                data-state={state}
                aria-hidden={gone || undefined}
                className={`tap relative flex min-h-[56px] items-center gap-3 overflow-hidden rounded-2xl border-2 px-3 py-2.5 text-left text-[15px] transition ${
                  state === 'gone' ? 'pointer-events-none border-transparent opacity-0'
                  : state === 'right' ? 'border-good bg-good/20'
                  : state === 'wrong' ? 'animate-wiggle border-bad bg-bad/20'
                  : state === 'sel' ? 'border-xp bg-xp/15'
                  : state === 'dim' ? 'border-line bg-card opacity-50'
                  : 'border-line bg-card hover:border-xp/60'
                }`}
              >
                {votes && !gone && <span className="absolute inset-y-0 left-0 bg-sky-400/15" style={{ width: `${votes[i] ?? 0}%` }} aria-hidden="true" />}
                <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-card-hi text-xs font-bold text-xp">{'ABCD'[i]}</span>
                <span className="relative flex-1">{o}</span>
                {votes && !gone && <span className="relative text-sm font-bold text-sky-300" aria-label={`${votes[i] ?? 0} Prozent`}>{votes[i] ?? 0} %</span>}
              </button>
            );
          })}
        </div>

        {!locked && (
          <div className="mt-5 grid grid-cols-[1fr_auto] gap-2">
            <Button variant="primary" disabled={picked === null} onClick={lock}>
              Finale Antwort{picked !== null ? `: ${'ABCD'[picked]}` : ''}
            </Button>
            <Button variant="ghost" onClick={walk} aria-label="Aussteigen und Gewinn mitnehmen">
              Aussteigen ({fmt(walkAway(level))})
            </Button>
          </div>
        )}
      </div>

      {locked && res && (
        <FeedbackSheet
          correct={correct}
          points={res.points}
          title={correct ? (level + 1 >= total ? 'MILLION! Richtig!' : `Richtig! ${fmt(LADDER[level])} Taler`) : 'Leider falsch'}
          text={q.explanation ?? (correct ? undefined : `Richtig wäre: ${q.options[q.correct]}`)}
          law={q.law}
          nextLabel={correct ? (level + 1 >= total ? 'Zur Auswertung' : 'Nächste Frage') : 'Zur Auswertung'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
