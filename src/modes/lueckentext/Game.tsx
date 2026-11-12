import { useMemo, useRef, useState } from 'react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { Button } from '@/ui/Button';
import { ChapterChip } from '@/ui/ChapterChip';
import { playSound } from '@/ui/sound';

type Seg = { kind: 'text'; text: string } | { kind: 'gap'; answer: string; n: number };

function parse(text: string): Seg[] {
  const out: Seg[] = [];
  let n = 0;
  for (const part of text.split(/(\{\{.+?\}\})/g)) {
    const m = part.match(/^\{\{(.+?)\}\}$/);
    if (m) out.push({ kind: 'gap', answer: m[1], n: n++ });
    else if (part) out.push({ kind: 'text', text: part });
  }
  return out;
}

const norm = (s: string) => s.trim().toLowerCase();

export default function Game({ items, onAnswer, onFinish, onClose, score, exam }: ModeProps) {
  const [idx, setIdx] = useState(0);
  const item = items[idx];
  if (item.type !== 'cloze') throw new Error('Lückentext braucht cloze-Aufgaben');
  const segs = useMemo(() => parse(item.text), [item.text]);
  const gaps = segs.filter((s): s is Extract<Seg, { kind: 'gap' }> => s.kind === 'gap');
  const chips = item.chips ?? [...gaps.map((g) => g.answer), ...item.distractors];

  // filled[g] = Index des Chips in der Lücke g (oder null)
  const [filled, setFilled] = useState<(number | null)[]>(() => gaps.map(() => null));
  const [res, setRes] = useState<AnswerResult | null>(null);
  const start = useRef(Date.now());
  const checked = res !== null;
  const used = new Set(filled.filter((x): x is number => x !== null));
  const allFilled = filled.every((x) => x !== null);

  const results = filled.map((c, g) => (c === null ? false : norm(chips[c]) === norm(gaps[g].answer)));
  const right = results.filter(Boolean).length;
  const perfect = right === gaps.length;

  const putChip = (c: number) => {
    if (checked || used.has(c)) return;
    const g = filled.findIndex((x) => x === null);
    if (g < 0) return;
    playSound('tap');
    setFilled((f) => f.map((x, i) => (i === g ? c : x)));
  };
  const takeBack = (g: number) => {
    if (checked || filled[g] === null) return;
    setFilled((f) => f.map((x, i) => (i === g ? null : x)));
  };

  const check = () => {
    const r = onAnswer({
      itemId: item.id,
      correct: perfect,
      timeMs: Date.now() - start.current,
      parts: { total: gaps.length, correct: right, errors: 0 },
    });
    if (exam) return onFinish({ score: 0, maxScore: 0 });
    playSound(perfect ? 'correct' : 'wrong');
    setRes(r);
  };

  const next = () => {
    if (idx + 1 >= items.length) return onFinish({ score: res?.total ?? score, maxScore: items.length * 300 });
    const nextItem = items[idx + 1];
    setIdx(idx + 1);
    setFilled(parse(nextItem.type === 'cloze' ? nextItem.text : '').filter((s) => s.kind === 'gap').map(() => null));
    setRes(null);
    start.current = Date.now();
  };

  return (
    <ModeFrame padBottom={checked}>
      <ModeHeader onClose={onClose} current={idx + (checked ? 1 : 0)} total={items.length} score={score} title="Lückentext" exam={exam} />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={item.chapter} />
        <h1 className="mt-2 font-display text-[22px] leading-tight">Setze die Wörter in die Lücken</h1>

        <p className="mt-4 rounded-2xl bg-card p-4 text-[17px] leading-[2.6]" data-testid="cloze-text">
          {segs.map((s, i) => {
            if (s.kind === 'text') return <span key={i}>{s.text}</span>;
            const c = filled[s.n];
            const state = !checked ? (c === null ? 'empty' : 'filled') : results[s.n] ? 'right' : 'wrong';
            return (
              <button
                key={i}
                onClick={() => takeBack(s.n)}
                data-testid={`gap-${s.n}`}
                data-state={state}
                aria-label={c === null ? `Lücke ${s.n + 1}, leer` : `Lücke ${s.n + 1}: ${chips[c]}`}
                className={`tap mx-1 inline-flex min-w-[84px] items-center justify-center rounded-xl border-2 px-2.5 align-middle text-[15px] font-bold leading-none ${
                  state === 'empty'
                    ? 'border-dashed border-mute/60 text-mute'
                    : state === 'filled'
                      ? 'border-p bg-p/15 text-ink'
                      : state === 'right'
                        ? 'border-good bg-good/15 text-good'
                        : 'border-bad bg-bad/15 text-bad'
                }`}
              >
                {c === null ? '…' : chips[c]}
              </button>
            );
          })}
        </p>

        <div className="mt-5 flex flex-wrap gap-2.5" role="group" aria-label="Wörter zur Auswahl">
          {chips.map((w, c) => (
            <button
              key={c}
              onClick={() => putChip(c)}
              disabled={checked || used.has(c)}
              className={`tap rounded-xl border-2 px-3.5 text-[15px] font-semibold transition active:scale-95 ${
                used.has(c) ? 'border-line bg-card opacity-30' : 'border-line bg-card-hi hover:border-p/70'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {!checked && (
          <Button variant="theme" block className="mt-6" disabled={!allFilled} onClick={check}>
            {exam ? 'Weiter' : 'Prüfen'}
          </Button>
        )}
      </div>

      {checked && res && (
        <FeedbackSheet
          correct={perfect}
          title={perfect ? 'Alle Lücken richtig!' : `${right} von ${gaps.length} Lücken richtig`}
          points={res.points}
          text={
            (perfect ? '' : `Richtig: ${gaps.map((g) => g.answer).join(' · ')}. `) + (item.explanation ?? '')
          }
          nextLabel={idx + 1 >= items.length ? 'Ergebnis ansehen' : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
