import { useRef, useState } from 'react';
import type { ModeProps } from '../types';
import type { Flashcard } from '@/content/schema';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';

/** Lernmodus ohne Punktedruck: umdrehen, „Wusste ich“ / „Nochmal“ – speist das Leitner-System */
export default function Game({ flashcards = [], onAnswer, onFinish, onClose }: ModeProps) {
  const total = flashcards.length;
  const [queue, setQueue] = useState<Flashcard[]>(flashcards);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [again, setAgain] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(0);
  const start = useRef(Date.now());
  const reported = useRef(new Set<string>());

  const card = queue[0];

  const judge = (wasKnown: boolean) => {
    if (!card || !flipped) return;
    if (!reported.current.has(card.id)) {
      reported.current.add(card.id);
      onAnswer({ itemId: card.id, correct: wasKnown, timeMs: Date.now() - start.current });
    }
    playSound(wasKnown ? 'correct' : 'tap');
    const rest = queue.slice(1);
    if (wasKnown) {
      if (!again.has(card.id)) setKnown((k) => k + 1);
      setDone((d) => d + 1);
    } else {
      setAgain((a) => new Set(a).add(card.id));
      rest.push(card); // kommt am Ende der Runde nochmal
    }
    setFlipped(false);
    start.current = Date.now();
    if (rest.length === 0) {
      onFinish({ score: 0, maxScore: total });
      return;
    }
    setQueue(rest);
  };

  useKeys((e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setFlipped((f) => !f);
      playSound('flip');
    }
    if (e.key === 'ArrowRight') judge(true);
    if (e.key === 'ArrowLeft') judge(false);
  });

  if (!card) return null;
  return (
    <ModeFrame>
      <ModeHeader onClose={onClose} current={done} total={total} title="Lernkarten" />
      <div className="flex flex-1 flex-col px-4 pb-6">
        <p className="mb-3 text-center text-sm text-mute">
          {flipped ? 'Wusstest du es?' : 'Überlege kurz – dann tippe die Karte an.'}
        </p>
        <div className="relative mx-auto w-full max-w-md flex-1" style={{ minHeight: 300 }}>
          <button
            onClick={() => {
              setFlipped((f) => !f);
              playSound('flip');
            }}
            aria-label={flipped ? 'Karte zurückdrehen' : 'Karte umdrehen'}
            data-testid="flashcard"
            data-flipped={flipped}
            className="absolute inset-0 h-full w-full [perspective:1000px]"
          >
            <span
              className="absolute inset-0 transition-transform duration-300 [transform-style:preserve-3d]"
              style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
            >
              <span className="pattern-bg absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-p to-[var(--p-dark)] p-6 text-center shadow-xl [backface-visibility:hidden]">
                <span className="text-xs font-bold tracking-widest text-white/70">BEGRIFF</span>
                <span className="mt-3 font-display text-3xl leading-tight text-white" data-testid="term">{card.term}</span>
                <span className="mt-5 inline-flex items-center gap-1 text-xs text-white/70">
                  <Icon name="reset" size={14} /> Tippen zum Umdrehen
                </span>
              </span>
              <span className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto rounded-3xl border-2 border-p bg-card-hi p-6 text-center shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <span className="text-xs font-bold tracking-widest text-p-accent">{card.term.toUpperCase()}</span>
                <span className="mt-3 text-[18px] leading-relaxed" data-testid="definition">{card.definition}</span>
              </span>
            </span>
          </button>
        </div>

        <div className="mx-auto mt-5 grid w-full max-w-md grid-cols-2 gap-3">
          <Button variant="secondary" disabled={!flipped} onClick={() => judge(false)}>
            <Icon name="reset" size={18} /> Nochmal
          </Button>
          <Button variant="confirm" disabled={!flipped} onClick={() => judge(true)}>
            <Icon name="check" size={18} /> Wusste ich
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-mute">PC: Leertaste dreht um · ← Nochmal · → Wusste ich</p>
        {known > 0 && <p className="sr-only" aria-live="polite">{known} gewusst</p>}
      </div>
    </ModeFrame>
  );
}
