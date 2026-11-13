import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { Button } from '@/ui/Button';
import { ChapterChip } from '@/ui/ChapterChip';
import { Icon } from '@/ui/Icon';
import { useSpeechConfig } from '@/ui/SpeakButton';
import { canSpeak, speak, stopSpeaking } from '@/ui/speech';
import { useKeys } from '@/ui/useKeys';
import { useFinishLabel } from '@/ui/sequence';
import { playSound } from '@/ui/sound';

export default function Game({ items, onAnswer, onFinish, onClose, score, exam }: ModeProps) {
  const finishLabel = useFinishLabel();
  const cfg = useSpeechConfig() ?? { lang: 'en-GB', rate: 0.95 };
  const can = canSpeak();
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const start = useRef(Date.now());
  const item = items[idx];
  if (item.type !== 'listen') throw new Error('Hören braucht listen-Aufgaben');
  const checked = res !== null;
  const good = checked && sel === item.correct;

  const play = (slow = false) => speak(item.text, { lang: cfg.lang, rate: cfg.rate * (slow ? 0.6 : 1) });

  // beim Öffnen einer Aufgabe einmal automatisch vorlesen (manche Handys erlauben das erst nach einem Tipp – dann hilft der Knopf)
  useEffect(() => {
    const t = setTimeout(() => play(false), 350);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const choose = (i: number) => {
    if (checked) return;
    if (exam) return setSel(i);
    const ok = i === item.correct;
    const r = onAnswer({ itemId: item.id, correct: ok, timeMs: Date.now() - start.current });
    playSound(ok ? 'correct' : 'wrong');
    setSel(i);
    setRes(r);
  };
  const commit = () => {
    if (sel === null) return;
    onAnswer({ itemId: item.id, correct: sel === item.correct, timeMs: Date.now() - start.current });
    onFinish({ score: 0, maxScore: 0 });
  };
  const next = () => {
    if (idx + 1 >= items.length) return onFinish({ score: res?.total ?? score, maxScore: items.length * 100 });
    setIdx(idx + 1);
    setSel(null);
    setRes(null);
    start.current = Date.now();
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= item.options.length) choose(n - 1);
    if (e.key === 'r' || e.key === 'R') play(false);
    if (exam && e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
  }, !checked);

  return (
    <ModeFrame padBottom={checked}>
      <ModeHeader onClose={onClose} current={idx + (checked ? 1 : 0)} total={items.length} score={score} title="Hören" exam={exam} lookup={checked || !can ? itemText(item) : undefined} />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={item.chapter} />
        <h1 className="mt-2 font-display text-[22px] leading-tight">Was hörst du?</h1>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => play(false)}
            aria-label="Satz anhören"
            className="tap grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-p text-white shadow-lg active:scale-95"
          >
            <Icon name="volume" size={36} />
          </button>
          <button
            onClick={() => play(true)}
            aria-label="Langsam anhören"
            className="tap grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-line bg-card text-mute active:scale-95"
          >
            <Icon name="turtle" size={26} />
          </button>
          <p className="text-sm text-mute">Tippe auf den Lautsprecher, so oft du magst.</p>
        </div>

        {!can && (
          <p role="status" className="mt-4 rounded-2xl border border-xp/40 bg-xp/10 p-3 text-[15px]" data-testid="no-tts">
            Dein Gerät kann gerade nicht vorlesen. Lies den Satz stattdessen: <b>„{item.text}“</b>
          </p>
        )}

        <div className="mt-5 grid gap-3" role="group" aria-label="Antworten">
          {item.options.map((o, i) => {
            const state = exam ? (sel === i ? 'sel' : 'idle') : !checked ? 'idle' : i === item.correct ? 'right' : i === sel ? 'wrong' : 'dim';
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={checked}
                data-state={state}
                className={`tap flex min-h-[56px] items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-[16px] transition ${
                  state === 'right'
                    ? 'border-good bg-good/15'
                    : state === 'wrong'
                      ? 'animate-wiggle border-bad bg-bad/15'
                      : state === 'sel'
                        ? 'border-p bg-p/15'
                        : state === 'dim'
                          ? 'border-line bg-card opacity-50'
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

      {checked && res && (
        <FeedbackSheet
          correct={good}
          points={res.points}
          title={good ? 'Richtig gehört!' : 'Das war es nicht'}
          text={`„${item.text}“${item.translation ? ` – ${item.translation}` : ''}`}
          nextLabel={idx + 1 >= items.length ? finishLabel : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
