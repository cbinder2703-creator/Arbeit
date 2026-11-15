import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ModeProps, PlayItem } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { useSettings } from '@/store/settings';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { ChapterChip } from '@/ui/ChapterChip';
import { Confetti } from '@/ui/Confetti';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';

export const LIVES = 3;
const ARENA_H = 440;
const BUBBLE_H = 150;
const RISE_S = 13; // Sekunden, bis eine Blase oben ist
const STAGGER_S = 4.5; // die zweite Blase einer Spur startet später → keine Überlappung

/** Startverzögerung der Blase `i` (Spur = i % 2) */
export const delayOf = (i: number): number => Math.floor(i / 2) * STAGGER_S + (i % 2) * 1.2;

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const reduce = useReducedMotion();
  const relaxed = useSettings((s) => s.relaxed);
  const qs = useMemo(() => items.filter((i): i is Extract<PlayItem, { type: 'mc' | 'truefalse' }> => i.type === 'mc' || i.type === 'truefalse'), [items]);
  const speed = relaxed ? 1.8 : 1;
  const dur = RISE_S * speed;

  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [picked, setPicked] = useState<number | null>(null); // -1 = Blase entwischt
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [end, setEnd] = useState(false);
  const resolved = useRef(false);
  const start = useRef(Date.now());
  const totalRef = useRef(score);

  const q = qs[idx];
  const options = q.type === 'mc' ? q.options : ['Wahr', 'Falsch'];
  const correctIdx = q.type === 'mc' ? q.correct : q.correct ? 0 : 1;
  const question = q.type === 'mc' ? q.question : q.statement;
  const lastDelay = delayOf(correctIdx);

  const resolve = (i: number) => {
    if (resolved.current) return;
    resolved.current = true;
    const ok = i === correctIdx;
    const r = onAnswer({ itemId: q.id, correct: ok, timeMs: Date.now() - start.current, timeLimitMs: reduce ? undefined : (lastDelay + dur) * 1000 });
    totalRef.current = r.total;
    playSound(ok ? 'correct' : 'wrong');
    if (!ok) setLives((l) => Math.max(0, l - 1));
    setPicked(i);
    setRes(r);
  };

  // die richtige Blase fliegt oben raus → Leben verloren (nicht bei „Bewegung reduzieren“)
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => resolve(-1), (lastDelay + dur) * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, reduce]);

  useKeys((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= options.length) resolve(n - 1);
  }, picked === null && !end);

  const correct = picked !== null && picked === correctIdx;
  const over = res !== null && (lives <= 0 || idx + 1 >= qs.length);
  const next = () => {
    if (over) {
      setEnd(true);
      return;
    }
    resolved.current = false;
    setPicked(null);
    setRes(null);
    setIdx(idx + 1);
    start.current = Date.now();
  };

  if (end) {
    const survived = lives > 0;
    return (
      <ModeFrame>
        {survived && <Confetti />}
        <div className="grid flex-1 place-items-center px-6 text-center" data-testid="end">
          <div>
            <span className={`mx-auto grid h-24 w-24 place-items-center rounded-full ${survived ? 'bg-sky-400/20 text-sky-300' : 'bg-bad/20 text-bad'}`}>
              <Icon name={survived ? 'target' : 'heart'} size={48} />
            </span>
            <h1 className="mt-4 text-3xl">{survived ? 'Alle Blasen geknackt!' : 'Alle Leben verloren'}</h1>
            <p className="mt-2 text-mute">{survived ? `Du hast noch ${lives} ${lives === 1 ? 'Leben' : 'Leben'} übrig.` : 'Die Blasen waren schneller – versuch es nochmal!'}</p>
            <Button className="mt-6" onClick={() => onFinish({ score: totalRef.current, maxScore: qs.length * 150 })}>Ergebnis ansehen</Button>
          </div>
        </div>
      </ModeFrame>
    );
  }

  const bubble = (i: number) => {
    const lane = i % 2;
    return (
      <motion.div
        key={`${idx}-${i}`}
        className="absolute bottom-0 w-[47%]"
        style={{ left: lane === 0 ? '1.5%' : '51.5%' }}
        initial={{ y: BUBBLE_H + 10 }}
        animate={{ y: -(ARENA_H + BUBBLE_H) }}
        transition={{ duration: dur, delay: delayOf(i), ease: 'linear' }}
      >
        <button
          onClick={() => resolve(i)}
          data-bubble={i}
          className="tap sway block w-full rounded-[32px] border-2 border-sky-300/50 bg-gradient-to-b from-sky-300/30 to-sky-500/20 px-4 py-4 text-center text-[14px] font-semibold leading-snug shadow-lg shadow-sky-500/20 backdrop-blur-sm active:scale-95"
          style={{ animationDelay: `${i * 0.4}s` }}
        >
          <span className="mb-1 block text-[11px] font-bold text-sky-200/80">{i + 1}</span>
          {options[i]}
        </button>
      </motion.div>
    );
  };

  return (
    <ModeFrame padBottom={picked !== null}>
      <ModeHeader
        onClose={onClose}
        current={idx + (picked !== null ? 1 : 0)}
        total={qs.length}
        score={score}
        title="Blasen-Quiz"
        lookup={picked !== null ? itemText(q) : undefined}
        right={
          <span className="flex gap-0.5" role="img" aria-label={`${lives} von ${LIVES} Leben`} data-testid="lives">
            {Array.from({ length: LIVES }, (_, i) => (
              <Icon key={i} name="heart" size={18} className={i < lives ? 'fill-bad text-bad' : 'text-line'} />
            ))}
          </span>
        }
      />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={q.chapter} />
        <h1 className="mt-2 font-display text-[21px] leading-snug lg:text-3xl" data-testid="question">
          {q.type === 'truefalse' && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
          {question}
        </h1>

        {picked === null && !reduce ? (
          <div
            className="relative mt-3 overflow-hidden rounded-3xl border border-line bg-gradient-to-t from-sky-950/60 to-transparent"
            style={{ height: ARENA_H }}
            role="group"
            aria-label="Antworten"
            data-testid="arena"
          >
            {options.map((_, i) => bubble(i))}
            <p className="pointer-events-none absolute inset-x-0 top-2 text-center text-xs text-sky-200/70">Tippe die richtige Blase – bevor sie oben verschwindet!</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-2.5 md:grid-cols-2" role="group" aria-label="Antworten">
            {options.map((o, i) => {
              const state = picked === null ? 'idle' : i === correctIdx ? 'right' : i === picked ? 'wrong' : 'dim';
              return (
                <button
                  key={i}
                  onClick={() => resolve(i)}
                  disabled={picked !== null}
                  data-state={state}
                  className={`tap flex min-h-[56px] items-center gap-3 rounded-[28px] border-2 px-4 py-3 text-left text-[15px] transition ${
                    state === 'right' ? 'border-good bg-good/15' : state === 'wrong' ? 'animate-wiggle border-bad bg-bad/15' : state === 'dim' ? 'border-line bg-card opacity-50' : 'border-sky-300/50 bg-sky-400/10'
                  }`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-card-hi text-xs font-bold text-mute">{i + 1}</span>
                  <span className="flex-1">{o}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {picked !== null && res && (
        <FeedbackSheet
          correct={correct}
          title={picked === -1 ? 'Die Blase ist entwischt!' : correct ? 'Geknackt!' : 'Falsche Blase'}
          points={res.points}
          text={q.explanation ?? (correct ? undefined : `Richtig wäre: ${options[correctIdx]}`)}
          law={q.law}
          nextLabel={over ? 'Weiter' : 'Nächste Blase'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
