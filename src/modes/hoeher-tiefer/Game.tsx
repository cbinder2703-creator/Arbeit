import { useMemo, useRef, useState } from 'react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { COMBO_FROM } from '@/engine/scoring';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { useFinishLabel } from '@/ui/sequence';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';
import { buildQuestions } from './questions';
import { MiniChart } from './MiniChart';

export default function Game({ charts, onAnswer, onFinish, onClose, score }: ModeProps) {
  const finishLabel = useFinishLabel();
  const questions = useMemo(() => buildQuestions(charts, 10), [charts]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const start = useRef(Date.now());
  const q = questions[idx];
  if (!q) return null;

  const higher = q.a.value > q.b.value ? 'a' : 'b';
  const correct = picked === higher;

  const pick = (side: 'a' | 'b') => {
    if (picked) return;
    const ok = side === higher;
    setRes(onAnswer({ itemId: q.id, correct: ok, timeMs: Date.now() - start.current }));
    playSound(ok ? 'correct' : 'wrong');
    setPicked(side);
  };
  const next = () => {
    if (idx + 1 >= questions.length) return onFinish({ score: res?.total ?? score, maxScore: questions.length * 100 });
    setIdx(idx + 1);
    setPicked(null);
    setRes(null);
    start.current = Date.now();
  };

  useKeys((e) => {
    if (e.key === 'ArrowLeft' || e.key === '1') pick('a');
    if (e.key === 'ArrowRight' || e.key === '2') pick('b');
  }, !picked);

  const card = (side: 'a' | 'b') => {
    const e = q[side];
    const state = !picked ? 'idle' : side === higher ? 'right' : side === picked ? 'wrong' : 'dim';
    return (
      <button
        key={side}
        onClick={() => pick(side)}
        disabled={!!picked}
        data-state={state}
        data-side={side}
        className={`tap flex min-h-[150px] flex-col items-center justify-center rounded-3xl border-2 p-3 text-center transition ${
          state === 'right' ? 'border-good bg-good/15' : state === 'wrong' ? 'animate-wiggle border-bad bg-bad/15' : state === 'dim' ? 'border-line bg-card opacity-60' : 'border-line bg-card hover:border-p/60 active:scale-[0.98]'
        }`}
      >
        <span className="font-display text-[20px] leading-tight">{e.label}</span>
        <span className="mt-2 font-display text-3xl text-xp" data-testid={`value-${side}`}>{picked ? `${e.value}${q.suffix}` : '?'}</span>
      </button>
    );
  };

  return (
    <ModeFrame padBottom={!!picked}>
      <ModeHeader onClose={onClose} current={idx + (picked ? 1 : 0)} total={questions.length} score={score} title="Höher oder tiefer?" />
      <div className="flex-1 px-4 pb-6">
        <div className="flex items-center justify-between gap-2">
          <Chip color="#84CC16">{q.title}</Chip>
          {res && res.combo >= COMBO_FROM && (
            <Chip color="#FACC15"><Icon name="flame" size={12} /> ×1,5 Combo</Chip>
          )}
        </div>
        <h1 className="mt-3 font-display text-[24px] leading-tight">Welcher Wert ist höher?</h1>
        <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label="Werte vergleichen">
          {card('a')}
          {card('b')}
        </div>
        {!picked && <p className="mt-3 text-center text-xs text-mute">Tippe auf den höheren Wert · PC: ← / →</p>}
        {picked && (
          <figure className="mt-5 rounded-2xl bg-card p-3">
            <MiniChart q={q} />
            {q.source && <figcaption className="mt-2 text-[11px] text-mute">Quelle: {q.source}</figcaption>}
          </figure>
        )}
      </div>
      {picked && res && (
        <FeedbackSheet
          correct={correct}
          points={res.points}
          text={`${q.a.label}: ${q.a.value}${q.suffix} · ${q.b.label}: ${q.b.value}${q.suffix}`}
          nextLabel={idx + 1 >= questions.length ? finishLabel : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
