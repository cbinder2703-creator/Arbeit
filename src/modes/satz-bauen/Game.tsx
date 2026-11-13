import { useRef, useState } from 'react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { matchesAnswer } from '@/engine/words';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { Button } from '@/ui/Button';
import { ChapterChip } from '@/ui/ChapterChip';
import { SpeakButton } from '@/ui/SpeakButton';
import { useKeys } from '@/ui/useKeys';
import { useFinishLabel } from '@/ui/sequence';
import { playSound } from '@/ui/sound';

export default function Game({ items, onAnswer, onFinish, onClose, score, exam }: ModeProps) {
  const finishLabel = useFinishLabel();
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]); // Indizes der Wörter in der Reihenfolge, wie sie gebaut wurden
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [ok, setOk] = useState(false);
  const start = useRef(Date.now());
  const item = items[idx];
  if (item.type !== 'translate') throw new Error('Satz bauen braucht translate-Aufgaben');
  const chips = item.chips ?? item.answer.split(/\s+/);
  const checked = res !== null;
  const built = chosen.map((i) => chips[i]);

  const put = (i: number) => {
    if (checked || chosen.includes(i)) return;
    playSound('tap');
    setChosen((c) => [...c, i]);
  };
  const take = (pos: number) => {
    if (checked) return;
    setChosen((c) => c.filter((_, k) => k !== pos));
  };

  const check = () => {
    if (!chosen.length || checked) return;
    const good = matchesAnswer(built, item.answer, item.alt);
    const r = onAnswer({ itemId: item.id, correct: good, timeMs: Date.now() - start.current });
    if (exam) return onFinish({ score: 0, maxScore: 0 });
    playSound(good ? 'correct' : 'wrong');
    setOk(good);
    setRes(r);
  };

  const next = () => {
    if (idx + 1 >= items.length) return onFinish({ score: res?.total ?? score, maxScore: items.length * 100 });
    setIdx(idx + 1);
    setChosen([]);
    setRes(null);
    start.current = Date.now();
  };

  useKeys((e) => {
    if (checked) return;
    if (e.key === 'Backspace') {
      e.preventDefault();
      setChosen((c) => c.slice(0, -1));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      check();
    }
  });

  return (
    <ModeFrame padBottom={checked}>
      <ModeHeader onClose={onClose} current={idx + (checked ? 1 : 0)} total={items.length} score={score} title="Satz bauen" exam={exam} lookup={itemText(item)} />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={item.chapter} />
        <h1 className="mt-2 font-display text-[22px] leading-tight">Übersetze diesen Satz</h1>
        <p className="mt-3 rounded-2xl bg-card p-4 font-display text-[20px] leading-snug" data-testid="prompt">
          {item.prompt}
        </p>

        {/* gebauter Satz */}
        <div
          className={`mt-4 flex min-h-[92px] flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed p-3 ${
            checked ? (ok ? 'border-good bg-good/10' : 'border-bad bg-bad/10') : 'border-line bg-card/50'
          }`}
          role="group"
          aria-label="Dein Satz"
          data-testid="answer-line"
        >
          {chosen.length === 0 && <span className="self-center text-sm text-mute">Tippe die Wörter in der richtigen Reihenfolge an …</span>}
          {chosen.map((ci, pos) => (
            <button
              key={`${pos}-${ci}`}
              onClick={() => take(pos)}
              disabled={checked}
              aria-label={`${chips[ci]} (entfernen)`}
              className="tap rounded-xl border-2 border-p bg-p/15 px-3 text-[16px] font-semibold"
            >
              {chips[ci]}
            </button>
          ))}
        </div>

        {/* Wortauswahl */}
        <div className="mt-4 flex flex-wrap gap-2.5" role="group" aria-label="Wörter zur Auswahl">
          {chips.map((w, i) => (
            <button
              key={i}
              onClick={() => put(i)}
              disabled={checked || chosen.includes(i)}
              className={`tap rounded-xl border-2 px-3.5 text-[16px] font-semibold transition active:scale-95 ${
                chosen.includes(i) ? 'border-line bg-card opacity-25' : 'border-line bg-card-hi hover:border-p/70'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {!checked && (
          <Button variant="theme" block className="mt-6" disabled={chosen.length === 0} onClick={check}>
            {exam ? 'Weiter' : 'Prüfen'}
          </Button>
        )}
      </div>

      {checked && res && (
        <FeedbackSheet
          correct={ok}
          points={res.points}
          title={ok ? 'Richtig!' : 'Fast – so geht der Satz:'}
          text={ok ? (item.explanation ?? item.answer) : `${item.answer}${item.explanation ? ` — ${item.explanation}` : ''}`}
          extra={
            <div className="mt-2">
              <SpeakButton text={item.answer} />
            </div>
          }
          nextLabel={idx + 1 >= items.length ? finishLabel : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
