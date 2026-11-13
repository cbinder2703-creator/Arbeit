import { useRef, useState } from 'react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { useFinishLabel } from '@/ui/sequence';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { Button } from '@/ui/Button';
import { ChapterChip } from '@/ui/ChapterChip';
import { Icon } from '@/ui/Icon';
import { playSound } from '@/ui/sound';

type Tab = 'vertrag' | 'checkliste';

export default function Game({ items, checklist, onAnswer, onFinish, onClose, score, exam }: ModeProps) {
  const finishLabel = useFinishLabel();
  const [idx, setIdx] = useState(0);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [tab, setTab] = useState<Tab>('vertrag');
  const start = useRef(Date.now());
  const item = items[idx];
  if (item.type !== 'spot') throw new Error('Vertrags-Detektiv braucht spot-Aufgaben');
  const checked = res !== null;

  const errorLines = item.lines.map((l, i) => (l.error ? i : -1)).filter((i) => i >= 0);
  const found = errorLines.filter((i) => marked.has(i)).length;
  const falseMarks = [...marked].filter((i) => !item.lines[i].error).length;
  const perfect = found === errorLines.length && falseMarks === 0;

  const toggle = (i: number) => {
    if (checked) return;
    playSound('tap');
    setMarked((m) => {
      const n = new Set(m);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  };

  const check = () => {
    const r = onAnswer({
      itemId: item.id,
      correct: perfect,
      timeMs: Date.now() - start.current,
      parts: { total: errorLines.length, correct: found, errors: falseMarks },
    });
    if (exam) return onFinish({ score: 0, maxScore: 0 });
    playSound(perfect ? 'correct' : 'wrong');
    setRes(r);
    setTab('vertrag');
  };

  const next = () => {
    if (idx + 1 >= items.length) return onFinish({ score: res?.total ?? score, maxScore: items.length * errorLines.length * 100 });
    setIdx(idx + 1);
    setMarked(new Set());
    setRes(null);
    start.current = Date.now();
  };

  return (
    <ModeFrame padBottom={checked}>
      <ModeHeader onClose={onClose} current={idx + (checked ? 1 : 0)} total={items.length} score={score} title="Vertrags-Detektiv" exam={exam} lookup={itemText(item)} />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={item.chapter} />
        <h1 className="mt-2 font-display text-[24px] leading-tight">{item.title}</h1>

        {checklist && (
          <div role="tablist" aria-label="Ansicht" className="mt-3 inline-flex rounded-xl bg-card p-1">
            {(['vertrag', 'checkliste'] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`tap rounded-lg px-4 text-sm font-bold ${tab === t ? 'bg-card-hi text-ink' : 'text-mute'}`}
              >
                {t === 'vertrag' ? 'Vertrag' : 'Checkliste'}
              </button>
            ))}
          </div>
        )}

        {tab === 'checkliste' && checklist ? (
          <section className="mt-3 rounded-2xl bg-card p-4" aria-label={checklist.title}>
            <h2 className="font-display text-lg">{checklist.title}</h2>
            <ol className="mt-2 space-y-2">
              {checklist.entries.map((e, i) => (
                <li key={i} className="flex gap-3 text-[15px] leading-snug">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-p/20 text-xs font-bold text-p-accent">{i + 1}</span>
                  {e}
                </li>
              ))}
            </ol>
          </section>
        ) : (
          <>
            <p className="mt-3 text-[15px] text-mute">{item.intro}</p>
            <ul className="mt-3 space-y-2" aria-label="Vertragszeilen">
              {item.lines.map((l, i) => {
                const isMarked = marked.has(i);
                const state = !checked
                  ? isMarked
                    ? 'marked'
                    : 'idle'
                  : l.error && isMarked
                    ? 'found'
                    : l.error
                      ? 'missed'
                      : isMarked
                        ? 'false'
                        : 'ok';
                const cls: Record<string, string> = {
                  idle: 'border-line bg-card hover:border-p/60',
                  marked: 'border-xp bg-xp/10',
                  found: 'border-good bg-good/10',
                  missed: 'border-orange-400 bg-orange-400/10',
                  false: 'border-bad bg-bad/10',
                  ok: 'border-line bg-card opacity-70',
                };
                const label: Record<string, string> = {
                  found: 'Richtig erkannt',
                  missed: 'Übersehen',
                  false: 'Fälschlich markiert',
                };
                return (
                  <li key={i}>
                    <button
                      onClick={() => toggle(i)}
                      aria-pressed={isMarked}
                      data-state={state}
                      disabled={checked}
                      className={`tap flex w-full items-start gap-3 rounded-xl border-2 px-3 py-3 text-left text-[15px] leading-snug transition ${cls[state]}`}
                    >
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-card-hi text-xs font-bold text-mute">{i + 1}</span>
                      <span className="flex-1">
                        {l.text}
                        {checked && label[state] && (
                          <span className={`mt-1 block text-xs font-bold ${state === 'found' ? 'text-good' : state === 'missed' ? 'text-orange-400' : 'text-bad'}`}>
                            {label[state]}
                            {l.fix && l.error ? ` – ${l.fix}` : ''}
                          </span>
                        )}
                      </span>
                      {isMarked && <Icon name="search" size={20} className={checked ? (l.error ? 'text-good' : 'text-bad') : 'text-xp'} />}
                    </button>
                  </li>
                );
              })}
            </ul>
            {!checked && (
              <Button variant="theme" block className="mt-5" onClick={check}>
                {exam ? `Weiter (${marked.size} markiert)` : <><Icon name="search" size={18} /> Prüfen ({marked.size} markiert)</>}
              </Button>
            )}
          </>
        )}
      </div>

      {checked && res && (
        <FeedbackSheet
          correct={perfect}
          title={`${found} von ${errorLines.length} Fehlern gefunden`}
          points={res.points}
          text={
            falseMarks > 0
              ? `${falseMarks} ${falseMarks === 1 ? 'Zeile war' : 'Zeilen waren'} gar nicht fehlerhaft (−${falseMarks * 50}).`
              : perfect
                ? 'Sauber gearbeitet – kein Fehler übersehen, nichts zu Unrecht markiert.'
                : 'Schau dir die orange markierten Zeilen an.'
          }
          nextLabel={idx + 1 >= items.length ? finishLabel : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
