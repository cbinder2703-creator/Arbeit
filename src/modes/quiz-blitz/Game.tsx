import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { COMBO_FROM } from '@/engine/scoring';
import { useSettings } from '@/store/settings';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { TimerRing } from '@/ui/TimerRing';
import { ChapterChip } from '@/ui/ChapterChip';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { Button } from '@/ui/Button';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';

const LIMIT_MS = 20_000;

export default function Game({ items, onAnswer, onFinish, onClose, score, exam }: ModeProps) {
  const relaxedSetting = useSettings((s) => s.relaxed);
  const relaxed = relaxedSetting || !!exam;
  const [sel, setSel] = useState<number | null>(null); // nur Abschlussprüfung
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); // -1 = Zeit abgelaufen
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [combo, setCombo] = useState(0);
  const [remaining, setRemaining] = useState(LIMIT_MS);
  const start = useRef(Date.now());
  const pickedRef = useRef<number | null>(null); // gegen Doppelantworten (Timer + Tippen)

  const item = items[idx];
  const isTF = item.type === 'truefalse';
  const options = item.type === 'mc' ? item.options : ['Wahr', 'Falsch'];
  const correctIdx = item.type === 'mc' ? item.correct : item.type === 'truefalse' ? (item.correct ? 0 : 1) : -1;
  const question = item.type === 'mc' ? item.question : item.type === 'truefalse' ? item.statement : '';

  const commit = () => {
    if (sel === null) return;
    onAnswer({ itemId: item.id, correct: sel === correctIdx, timeMs: Date.now() - start.current });
    onFinish({ score: 0, maxScore: 0 });
  };

  const answer = useCallback(
    (i: number) => {
      if (exam) return setSel(i);
      if (pickedRef.current !== null) return;
      pickedRef.current = i;
      const correct = i === correctIdx;
      const r = onAnswer({
        itemId: item.id,
        correct,
        timeMs: Date.now() - start.current,
        timeLimitMs: relaxed ? undefined : LIMIT_MS,
      });
      playSound(correct ? 'correct' : 'wrong');
      setPicked(i);
      setRes(r);
      setCombo(r.combo);
    },
    [correctIdx, onAnswer, item.id, relaxed, exam],
  );

  // Zeitlimit
  useEffect(() => {
    if (relaxed || picked !== null) return;
    start.current = Date.now();
    setRemaining(LIMIT_MS);
    const t = setInterval(() => {
      if (pickedRef.current !== null) return clearInterval(t);
      const left = LIMIT_MS - (Date.now() - start.current);
      if (left <= 0) {
        clearInterval(t);
        setRemaining(0);
        answer(-1);
      } else setRemaining(left);
    }, 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, relaxed]);

  const next = () => {
    if (idx + 1 >= items.length) {
      onFinish({ score: res?.total ?? score, maxScore: items.length * 150 });
      return;
    }
    setIdx(idx + 1);
    pickedRef.current = null;
    setPicked(null);
    setRes(null);
    start.current = Date.now();
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= options.length) answer(n - 1);
    if (exam && e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  }, picked === null);

  const timedOut = picked === -1;
  const correct = picked !== null && picked === correctIdx;

  return (
    <ModeFrame padBottom={picked !== null}>
      <ModeHeader onClose={onClose} current={idx + (picked !== null ? 1 : 0)} total={items.length} score={score} exam={exam} />
      <div className="flex flex-1 flex-col px-4 pb-6">
        <div className="mt-1 flex items-center justify-between gap-2">
          <ChapterChip chapter={item.chapter} />
          {combo >= COMBO_FROM && (
            <Chip color="#FACC15" className="animate-wiggle">
              <Icon name="flame" size={12} /> ×1,5 Combo
            </Chip>
          )}
        </div>

        {!relaxed && (
          <div className="mt-4 flex justify-center">
            <TimerRing remainingMs={picked !== null ? Math.max(remaining, 0) : remaining} totalMs={LIMIT_MS} />
          </div>
        )}

        <h1 className={`${relaxed ? 'mt-6' : 'mt-4'} font-display text-[23px] leading-snug lg:text-3xl`} data-testid="question">
          {isTF && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
          {question}
        </h1>

        <div className="mt-5 grid gap-3 md:grid-cols-2" role="group" aria-label="Antworten">
          {options.map((o, i) => {
            const state = exam ? (sel === i ? 'sel' : 'idle') : picked === null ? 'idle' : i === correctIdx ? 'right' : i === picked ? 'wrong' : 'dim';
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={picked !== null}
                data-state={state}
                className={`tap flex min-h-[56px] items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-[15px] font-medium transition ${
                  state === 'right'
                    ? 'border-good bg-good/15'
                    : state === 'wrong'
                      ? 'animate-wiggle border-bad bg-bad/15'
                      : state === 'dim'
                        ? 'border-line bg-card opacity-50'
                        : state === 'sel'
                          ? 'border-p bg-p/15'
                          : 'border-line bg-card hover:border-p/60 active:scale-[0.99]'
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-card-hi text-xs font-bold text-mute">{i + 1}</span>
                <span className="flex-1">{o}</span>
                {state === 'right' && <Check className="shrink-0 text-good" size={22} strokeWidth={3} aria-label="richtig" />}
                {state === 'wrong' && <X className="shrink-0 text-bad" size={22} strokeWidth={3} aria-label="falsch" />}
              </button>
            );
          })}
        </div>
        {exam && (
          <Button variant="theme" block className="mt-5" disabled={sel === null} onClick={commit}>
            Weiter
          </Button>
        )}
      </div>

      {picked !== null && res && (
        <FeedbackSheet
          correct={correct}
          title={timedOut ? 'Zeit abgelaufen' : undefined}
          points={res.points}
          text={
            item.explanation ??
            (correct ? undefined : `Richtig wäre: ${options[correctIdx]}`)
          }
          law={item.law}
          nextLabel={idx + 1 >= items.length ? 'Ergebnis ansehen' : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
