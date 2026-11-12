import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { Button } from './Button';
import { Chip } from './Chip';
import { useKeys } from './useKeys';

interface Props {
  correct: boolean;
  /** Überschrift, Standard „Richtig!“ / „Leider falsch“ */
  title?: string;
  points?: number;
  text?: string;
  law?: string;
  extra?: ReactNode;
  nextLabel?: string;
  onNext: () => void;
}

/** Feedback von unten: grün/rot, Erklärung, Paragraf, „Weiter“ (Enter) */
export function FeedbackSheet({ correct, title, points, text, law, extra, nextLabel = 'Weiter', onNext }: Props) {
  const btn = useRef<HTMLButtonElement>(null);
  const done = useRef(false);
  const go = () => {
    if (done.current) return;
    done.current = true;
    onNext();
  };
  useEffect(() => {
    btn.current?.focus({ preventScroll: true });
  }, []);
  useKeys((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      go();
    }
  });

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="feedback"
      data-correct={correct}
      className={`animate-sheet fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl rounded-t-3xl border-t-2 px-4 pt-3 shadow-2xl shadow-black/60 ${
        correct ? 'border-good bg-[#0F2A1C]' : 'border-bad bg-[#2A1115]'
      }`}
      style={{ paddingBottom: 'calc(var(--safe-bottom) + 1rem)' }}
    >
      <div className={`mx-auto mb-2 h-1 w-10 rounded-full ${correct ? 'bg-good/40' : 'bg-bad/40'}`} />
      <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 font-display text-xl ${correct ? 'text-good' : 'text-bad'}`}>
          <Icon name={correct ? 'check' : 'x'} size={22} strokeWidth={3} />
          {title ?? (correct ? 'Richtig!' : 'Leider falsch')}
        </div>
        {points !== undefined && points > 0 && <div className="font-display text-xl text-xp">+{points}</div>}
      </div>
      {text && <p className="mt-1.5 max-h-[28dvh] overflow-y-auto text-[15px] leading-snug text-ink/90">{text}</p>}
      {law && (
        <div className="mt-2">
          <Chip color="#F97316">{law}</Chip>
        </div>
      )}
      {extra}
      <Button ref={btn} variant={correct ? 'confirm' : 'theme'} block className="mt-3" onClick={go}>
        {nextLabel}
      </Button>
    </div>
  );
}
