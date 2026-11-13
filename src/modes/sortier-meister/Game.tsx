import { useRef, useState } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { partsPoints } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { useFinishLabel } from '@/ui/sequence';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { ChapterChip } from '@/ui/ChapterChip';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';

const ZONE_COLORS = ['#F97316', '#3B82F6', '#10B981', '#A855F7'];

interface Cat {
  id: string;
  label: string;
}

function Zone({
  cat,
  color,
  index,
  texts,
  onTap,
  disabled,
}: {
  cat: Cat;
  color: string;
  index: number;
  texts: string[];
  onTap: () => void;
  disabled: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: cat.id, disabled });
  return (
    <button
      ref={setNodeRef}
      onClick={onTap}
      aria-label={`Fach ${index + 1}: ${cat.label}, ${texts.length} Karten`}
      data-testid={`zone-${cat.id}`}
      className="no-select flex min-h-[150px] min-w-0 flex-col rounded-2xl border-2 border-dashed p-2.5 text-left transition"
      style={{ borderColor: color, background: isOver ? `${color}33` : `${color}12` }}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-display text-[15px] leading-tight" style={{ color }}>{cat.label}</span>
        <span className="rounded-md bg-black/25 px-1.5 text-[11px] font-bold text-mute">{index + 1}</span>
      </span>
      <span className="mb-1.5 text-[11px] text-mute">{texts.length} {texts.length === 1 ? 'Karte' : 'Karten'}</span>
      <span className="flex flex-col gap-1.5">
        {texts.map((t, i) => (
          <span key={i} className="break-words rounded-lg bg-card px-2 py-1.5 text-center text-[12px] leading-tight">
            {t}
          </span>
        ))}
      </span>
    </button>
  );
}

function CurrentCard({
  text,
  selected,
  onTap,
  shake,
}: {
  text: string;
  selected: boolean;
  onTap: () => void;
  shake: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: 'card' });
  return (
    <button
      ref={setNodeRef}
      key={shake}
      {...attributes}
      {...listeners}
      onClick={onTap}
      aria-pressed={selected}
      data-testid="current-card"
      className={`${shake ? 'animate-wiggle' : ''} no-select relative z-10 min-h-[84px] w-full max-w-xs rounded-2xl bg-white px-5 py-4 text-center font-display text-xl leading-snug text-[#0B1020] shadow-xl shadow-black/40 ${
        selected ? 'ring-4 ring-xp' : ''
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        touchAction: 'none',
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${isDragging ? 3 : -1}deg)` : 'rotate(-1deg)',
        zIndex: isDragging ? 50 : 10,
      }}
    >
      {text}
    </button>
  );
}

export default function Game({ items, onAnswer, onFinish, onClose, exam }: ModeProps) {
  const finishLabel = useFinishLabel();
  const item = items[0];
  if (item.type !== 'sort') throw new Error('Sortier-Meister braucht eine sort-Aufgabe');
  const cards = item.cards; // von der Engine gemischt
  const cats = item.categories;

  const [cur, setCur] = useState(0);
  const [placed, setPlaced] = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState(false);
  const [errors, setErrors] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const [triedWrong, setTriedWrong] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [done, setDone] = useState<AnswerResult | null>(null);
  const [examWrong, setExamWrong] = useState(0);
  const started = useRef(Date.now());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const card = cards[cur];
  const live = done ? done.total : partsPoints({ correct: firstTry, errors });

  const place = (catId: string) => {
    if (done || !card) return;
    const cat = cats.find((c) => c.id === catId);
    if (!cat) return;
    if (exam) {
      // Prüfung: Einsortieren ist endgültig, kein Hinweis
      const wrong = examWrong + (card.category === catId ? 0 : 1);
      setExamWrong(wrong);
      setPlaced((p) => ({ ...p, [catId]: [...(p[catId] ?? []), card.text] }));
      setSelected(false);
      if (cur + 1 >= cards.length) {
        onAnswer({ itemId: item.id, correct: wrong === 0, timeMs: Date.now() - started.current, parts: { total: cards.length, correct: cards.length - wrong, errors: 0 } });
        onFinish({ score: 0, maxScore: 0 });
      } else setCur(cur + 1);
      return;
    }
    if (card.category === catId) {
      const ft = triedWrong ? firstTry : firstTry + 1;
      playSound('correct');
      setPlaced((p) => ({ ...p, [catId]: [...(p[catId] ?? []), card.text] }));
      setFirstTry(ft);
      setTriedWrong(false);
      setSelected(false);
      setHint(null);
      if (cur + 1 >= cards.length) {
        const r = onAnswer({
          itemId: item.id,
          correct: errors === 0,
          timeMs: Date.now() - started.current,
          parts: { total: cards.length, correct: ft, errors },
        });
        setDone(r);
      } else setCur(cur + 1);
    } else {
      playSound('wrong');
      setErrors((e) => e + 1);
      setTriedWrong(true);
      setShake((s) => s + 1);
      setSelected(false);
      setHint(`Nicht ganz – „${card.text}“ gehört nicht zu „${cat.label}“. Versuch es nochmal. (−50)`);
    }
  };

  const tapZone = (id: string) => {
    if (!selected) {
      setHint('Tippe zuerst die Karte an – oder ziehe sie direkt in ein Fach.');
      return;
    }
    place(id);
  };

  const onDragEnd = (e: DragEndEvent) => {
    if (e.over) place(String(e.over.id));
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= cats.length) place(cats[n - 1].id);
  }, !done);

  const cols = cats.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <ModeFrame padBottom={!!done}>
      <ModeHeader onClose={onClose} current={Math.min(cur + (done ? 1 : 0), cards.length)} total={cards.length} score={exam ? undefined : live} exam={exam} lookup={itemText(item)} />
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex flex-1 flex-col px-4 pb-4">
          <ChapterChip chapter={item.chapter} />
          <h1 className="mt-2 font-display text-[24px] leading-tight">{item.question}</h1>
          <p className="text-sm text-mute">Ziehen oder antippen</p>

          <div className={`mt-4 grid ${cols} gap-2.5`}>
            {cats.map((c, i) => (
              <Zone
                key={c.id}
                cat={c}
                index={i}
                color={ZONE_COLORS[i % ZONE_COLORS.length]}
                texts={placed[c.id] ?? []}
                onTap={() => tapZone(c.id)}
                disabled={!!done}
              />
            ))}
          </div>

          <div className="sticky bottom-0 mt-auto bg-gradient-to-t from-bg via-bg to-transparent pb-[calc(var(--safe-bottom)+0.75rem)] pt-5">
            {!done && card && (
              <div className="flex flex-col items-center">
                <CurrentCard text={card.text} selected={selected} onTap={() => setSelected((s) => !s)} shake={shake} />
                <p className="mt-3 min-h-[40px] text-center text-sm" role="status" data-testid="hint">
                  {hint ? <span className="text-bad">{hint}</span> : <span className="text-mute">Karte {cur + 1} von {cards.length} · Noch {cards.length - cur} im Stapel</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      </DndContext>

      {done && (
        <FeedbackSheet
          correct={errors === 0}
          title={errors === 0 ? 'Alles richtig sortiert!' : `Geschafft – ${errors} ${errors === 1 ? 'Fehler' : 'Fehler'}`}
          points={done.points}
          text={item.explanation}
          nextLabel={finishLabel}
          onNext={() => onFinish({ score: done.total, maxScore: cards.length * 100 })}
        />
      )}
    </ModeFrame>
  );
}
