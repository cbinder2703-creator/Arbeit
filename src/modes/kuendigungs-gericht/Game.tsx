import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { ChapterChip } from '@/ui/ChapterChip';
import { Icon } from '@/ui/Icon';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';

export default function Game({ items, onAnswer, onFinish, onClose, score, exam }: ModeProps) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const start = useRef(Date.now());
  const item = items[idx];
  if (item.type !== 'case') throw new Error('Kündigungs-Gericht braucht case-Aufgaben');
  const last = idx + 1 >= items.length;
  const correct = res !== null && sel === item.correct;

  const verdict = () => {
    if (sel === null || res) return;
    const ok = sel === item.correct;
    if (exam) {
      onAnswer({ itemId: item.id, correct: ok, timeMs: Date.now() - start.current });
      onFinish({ score: 0, maxScore: 0 });
      return;
    }
    setRes(onAnswer({ itemId: item.id, correct: ok, timeMs: Date.now() - start.current }));
    playSound('hammer');
    setTimeout(() => playSound(ok ? 'correct' : 'wrong'), 220);
  };
  const next = () => {
    if (last) return onFinish({ score: res?.total ?? score, maxScore: items.length * 100 });
    setIdx(idx + 1);
    setSel(null);
    setRes(null);
    start.current = Date.now();
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (!res && n >= 1 && n <= item.options.length) setSel(n - 1);
    if (e.key === 'Enter') {
      e.preventDefault();
      if (res) next();
      else verdict();
    }
  });

  return (
    <ModeFrame>
      <ModeHeader onClose={onClose} current={idx + (res ? 1 : 0)} total={items.length} score={score} title="Kündigungs-Gericht" exam={exam} lookup={itemText(item)} />
      <div className="flex-1 px-4 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <ChapterChip chapter={item.chapter} />
          <span className="text-xs font-semibold text-mute">Fall {idx + 1}/{items.length}</span>
        </div>

        {/* Fallakte als Papierkarte */}
        <article
          className="relative rounded-2xl p-4 pt-6 shadow-xl shadow-black/40"
          style={{ background: '#F3E7C9', color: '#2B2112' }}
          aria-label={`Fallakte: ${item.title}`}
        >
          <span className="absolute -top-2.5 left-3 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-widest" style={{ background: '#E5D3A4' }}>
            FALLAKTE {item.id.split('-')[1]}
          </span>
          <h1 className="font-display text-[22px] leading-tight">{item.title}</h1>
          <p className="mt-2 text-[15px] leading-relaxed">{item.situation}</p>
          <p className="mt-3 text-[15px] font-bold">{item.question}</p>
          {res && (
            <motion.div
              initial={reduce ? false : { scale: 2.2, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: -8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 16 }}
              data-testid="stamp"
              className="pointer-events-none mt-3 inline-block rounded-lg border-4 px-3 py-1 font-display text-lg uppercase tracking-widest"
              style={{ color: correct ? '#15803D' : '#B91C1C', borderColor: correct ? '#15803D' : '#B91C1C' }}
            >
              {correct ? 'Urteil bestätigt' : 'Revision'}
            </motion.div>
          )}
        </article>

        <h2 className="mb-2 mt-5 flex items-center gap-2 text-xs font-bold tracking-widest text-mute">
          <Icon name="gavel" size={14} /> DEIN URTEIL
        </h2>
        <div role="radiogroup" aria-label="Dein Urteil" className="grid gap-2.5">
          {item.options.map((o, i) => {
            const state = !res ? (sel === i ? 'sel' : 'idle') : i === item.correct ? 'right' : i === sel ? 'wrong' : 'dim';
            return (
              <button
                key={i}
                role="radio"
                aria-checked={sel === i}
                disabled={!!res}
                onClick={() => setSel(i)}
                data-state={state}
                className={`tap flex min-h-[56px] items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-[15px] transition ${
                  state === 'right'
                    ? 'border-good bg-good/15'
                    : state === 'wrong'
                      ? 'animate-wiggle border-bad bg-bad/15'
                      : state === 'sel'
                        ? 'border-p bg-p/15'
                        : state === 'dim'
                          ? 'border-line bg-card opacity-50'
                          : 'border-line bg-card hover:border-p/60'
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${state === 'sel' || state === 'right' ? 'border-current' : 'border-mute/50'}`}
                  aria-hidden="true"
                >
                  {state === 'right' && <Check size={14} strokeWidth={3} className="text-good" />}
                  {state === 'wrong' && <X size={14} strokeWidth={3} className="text-bad" />}
                  {state === 'sel' && <span className="h-2.5 w-2.5 rounded-full bg-p" />}
                </span>
                <span className="flex-1">{o}</span>
              </button>
            );
          })}
        </div>

        {!res ? (
          <Button variant="theme" block className="mt-5" disabled={sel === null} onClick={verdict}>
            {exam ? 'Weiter' : <><Icon name="gavel" size={18} /> Urteil sprechen</>}
          </Button>
        ) : (
          <div
            role="status"
            data-testid="feedback"
            data-correct={correct}
            className={`mt-5 rounded-2xl border-2 p-4 ${correct ? 'border-good bg-[#0F2A1C]' : 'border-bad bg-[#2A1115]'}`}
          >
            <div className="flex items-center justify-between">
              <div className={`font-display text-lg ${correct ? 'text-good' : 'text-bad'}`}>{correct ? 'Richtig!' : 'Leider falsch'}</div>
              {res.points > 0 && <div className="font-display text-lg text-xp">+{res.points}</div>}
            </div>
            <p className="mt-1 text-[15px] leading-snug">{item.explanation}</p>
            {item.law && (
              <div className="mt-2">
                <Chip color="#F97316">{item.law}</Chip>
              </div>
            )}
            <Button variant="theme" block className="mt-4" onClick={next}>
              {last ? 'Ergebnis ansehen' : 'Nächster Fall'}
            </Button>
          </div>
        )}
      </div>
    </ModeFrame>
  );
}
