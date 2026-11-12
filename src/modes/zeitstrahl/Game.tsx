import { useRef, useState } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { Button } from '@/ui/Button';
import { ChapterChip } from '@/ui/ChapterChip';
import { Icon } from '@/ui/Icon';
import { playSound } from '@/ui/sound';

interface Step {
  /** Position in der richtigen Reihenfolge (0-basiert) */
  id: number;
  text: string;
}

function Row({
  step,
  pos,
  total,
  checked,
  selected,
  onSelect,
  onMove,
}: {
  step: Step;
  pos: number;
  total: number;
  checked: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const controls = useDragControls();
  const ok = step.id === pos;
  return (
    <Reorder.Item
      value={step}
      dragListener={false}
      dragControls={controls}
      layout="position"
      data-testid={`step-${pos}`}
      data-state={!checked ? 'idle' : ok ? 'right' : 'wrong'}
      tabIndex={checked ? -1 : 0}
      onClick={() => !checked && onSelect()}
      aria-current={selected || undefined}
      aria-label={`Platz ${pos + 1} von ${total}: ${step.text}`}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (checked) return;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          onMove(-1);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          onMove(1);
        }
      }}
      className={`no-select flex min-h-[60px] list-none items-center gap-2 rounded-2xl border-2 bg-card px-2 py-2 outline-none ${
        !checked ? (selected ? 'border-xp bg-xp/10' : 'border-line focus-visible:border-xp') : ok ? 'border-good bg-good/10' : 'border-bad bg-bad/10'
      }`}
    >
      <span
        onPointerDown={(e) => !checked && controls.start(e)}
        onContextMenu={(e) => e.preventDefault()}
        className="tap no-select grid shrink-0 cursor-grab place-items-center rounded-xl text-mute active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        aria-hidden="true"
      >
        <Icon name="grip" size={24} />
      </span>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-card-hi text-xs font-bold text-mute">{pos + 1}</span>
      <span className="min-w-0 flex-1 text-[15px] leading-snug">
        {step.text}
        {checked && !ok && <span className="mt-0.5 block text-xs font-bold text-bad">→ gehört auf Platz {step.id + 1}</span>}
      </span>
      {!checked && (
        <span className="hidden shrink-0 gap-1 md:flex">
          <button onClick={() => onMove(-1)} disabled={pos === 0} aria-label="Nach oben" className="tap grid place-items-center rounded-lg text-mute hover:bg-card-hi disabled:opacity-30">
            <Icon name="chevron-left" size={20} className="rotate-90" />
          </button>
          <button onClick={() => onMove(1)} disabled={pos === total - 1} aria-label="Nach unten" className="tap grid place-items-center rounded-lg text-mute hover:bg-card-hi disabled:opacity-30">
            <Icon name="chevron-left" size={20} className="-rotate-90" />
          </button>
        </span>
      )}
    </Reorder.Item>
  );
}

const toSteps = (item: ModeProps['items'][number]): Step[] => {
  if (item.type !== 'order') return [];
  const shown = item.shuffledSteps ?? item.steps;
  // doppelte Texte bekommen die jeweils nächste freie Lösungsposition
  const taken = new Set<number>();
  return shown.map((text) => {
    const id = item.steps.findIndex((s, i) => s === text && !taken.has(i));
    taken.add(id);
    return { id, text };
  });
};

export default function Game({ items, onAnswer, onFinish, onClose, score, exam }: ModeProps) {
  const [idx, setIdx] = useState(0);
  const item = items[idx];
  if (item.type !== 'order') throw new Error('Zeitstrahl braucht order-Aufgaben');
  const [order, setOrder] = useState<Step[]>(() => toSteps(item));
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [selId, setSelId] = useState<number | null>(null);
  const start = useRef(Date.now());
  const listRef = useRef<HTMLUListElement>(null);
  const checked = res !== null;

  const right = order.filter((s, i) => s.id === i).length;
  const perfect = right === order.length;

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const n = [...order];
    [n[i], n[j]] = [n[j], n[i]];
    setOrder(n);
    playSound('tap');
    // Fokus bleibt an der verschobenen Zeile (Tastatur)
    if (document.activeElement && listRef.current?.contains(document.activeElement)) {
      requestAnimationFrame(() => (listRef.current?.children[j] as HTMLElement | undefined)?.focus());
    }
  };

  const check = () => {
    const r = onAnswer({
      itemId: item.id,
      correct: perfect,
      timeMs: Date.now() - start.current,
      parts: { total: order.length, correct: right, errors: 0 },
    });
    if (exam) return onFinish({ score: 0, maxScore: 0 });
    playSound(perfect ? 'correct' : 'wrong');
    setRes(r);
  };

  const next = () => {
    if (idx + 1 >= items.length) return onFinish({ score: res?.total ?? score, maxScore: items.reduce((n, it) => n + (it.type === 'order' ? it.steps.length * 100 : 0), 0) });
    setOrder(toSteps(items[idx + 1]));
    setIdx(idx + 1);
    setRes(null);
    start.current = Date.now();
  };

  return (
    <ModeFrame padBottom={checked}>
      <ModeHeader onClose={onClose} current={idx + (checked ? 1 : 0)} total={items.length} score={score} title="Zeitstrahl" exam={exam} lookup={itemText(item)} />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={item.chapter} />
        <h1 className="mt-2 font-display text-[22px] leading-tight">{item.question}</h1>
        <p className="mt-1 text-sm text-mute">Am Griff ziehen – oder Zeile wählen und ↑ ↓ drücken.</p>

        <Reorder.Group
          as="ul"
          ref={listRef}
          axis="y"
          values={order}
          onReorder={(v) => !checked && setOrder(v)}
          className="no-select mt-4 space-y-2"
          aria-label="Schritte"
        >
          {order.map((s, i) => (
            <Row key={s.id} step={s} pos={i} total={order.length} checked={checked} selected={selId === s.id} onSelect={() => setSelId(s.id)} onMove={(d) => move(i, d)} />
          ))}
        </Reorder.Group>

        {!checked && (
          <div className="mt-3 rounded-2xl bg-card p-3" role="group" aria-label="Ausgewählte Zeile verschieben">
            <p className="mb-2 text-center text-xs text-mute">
              {selId === null ? 'Tipp: Zeile antippen, dann hier verschieben – oder am Griff ziehen.' : 'Zeile ausgewählt – verschieben:'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                disabled={selId === null || order.findIndex((s) => s.id === selId) <= 0}
                onClick={() => selId !== null && move(order.findIndex((s) => s.id === selId), -1)}
                aria-label="Ausgewählte Zeile nach oben"
              >
                <Icon name="chevron-left" size={20} className="rotate-90" /> Hoch
              </Button>
              <Button
                variant="secondary"
                disabled={selId === null || order.findIndex((s) => s.id === selId) >= order.length - 1}
                onClick={() => selId !== null && move(order.findIndex((s) => s.id === selId), 1)}
                aria-label="Ausgewählte Zeile nach unten"
              >
                <Icon name="chevron-left" size={20} className="-rotate-90" /> Runter
              </Button>
            </div>
          </div>
        )}
        {!checked && (
          <Button variant="theme" block className="mt-5" onClick={check}>
            {exam ? 'Weiter' : 'Prüfen'}
          </Button>
        )}
      </div>

      {checked && res && (
        <FeedbackSheet
          correct={perfect}
          title={perfect ? 'Reihenfolge stimmt!' : `${right} von ${order.length} an der richtigen Stelle`}
          points={res.points}
          text={item.explanation}
          nextLabel={idx + 1 >= items.length ? 'Ergebnis ansehen' : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
