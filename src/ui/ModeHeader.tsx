import { useState } from 'react';
import type { ReactNode } from 'react';
import { useOptionalPruefung } from '@/app/pruefungContext';
import { GlossarSheet } from './GlossarSheet';
import { useSequence } from './sequence';
import { Icon } from './Icon';
import { ProgressBar } from './ProgressBar';

/** Kopfzeile aller Modi: Schließen (×) · Fortschrittsbalken · Zähler · Punkte */
export function ModeHeader({
  onClose,
  current,
  total,
  score,
  right,
  title,
  exam,
  lookup,
  onLookupChange,
}: {
  onClose: () => void;
  current: number;
  total: number;
  score?: number;
  right?: ReactNode;
  title?: string;
  exam?: { index: number; total: number };
  /** Text der aktuellen Aufgabe → zeigt den Knopf „Begriff?“ (nicht in der Abschlussprüfung) */
  lookup?: string;
  /** wird beim Öffnen/Schließen aufgerufen (z. B. um einen Timer anzuhalten) */
  onLookupChange?: (open: boolean) => void;
}) {
  const pr = useOptionalPruefung();
  const seq = useSequence();
  const [open, setOpen] = useState(false);
  const canLookup = !!pr && lookup !== undefined && !exam;
  const toggle = (v: boolean) => {
    setOpen(v);
    onLookupChange?.(v);
  };
  if (seq && !exam) {
    // Aufgabe innerhalb einer Lektion/Folge: Fortschritt der ganzen Folge zeigen
    current = seq.index - 1 + (current > 0 ? 1 : 0);
    total = seq.total;
  }
  if (exam) {
    current = exam.index;
    total = exam.total;
    score = undefined;
    title = 'Abschlussprüfung';
  }
  return (
    <header className="flex items-center gap-2 px-2 pb-2 pt-[calc(var(--safe-top)+0.5rem)]">
      <button onClick={onClose} aria-label="Runde beenden" className="tap grid shrink-0 place-items-center rounded-xl text-mute hover:bg-card-hi hover:text-ink">
        <Icon name="x" size={24} />
      </button>
      {canLookup && (
        <button
          onClick={() => toggle(true)}
          aria-label="Begriff nachschlagen"
          className="tap inline-flex shrink-0 items-center gap-1 rounded-full bg-xp/15 px-3 text-sm font-bold text-xp hover:bg-xp/25"
        >
          <Icon name="lightbulb" size={18} /> Begriff?
        </button>
      )}
      {title && <span className={`truncate font-display text-lg ${exam ? '' : 'hidden sm:block'}`}>{title}</span>}
      <ProgressBar percent={total ? (current / total) * 100 : 0} className="flex-1" height={8} />
      <span className="w-10 shrink-0 text-center text-xs text-mute" aria-label={`Aufgabe ${current} von ${total}`}>
        {current}/{total}
      </span>
      {right}
      {score !== undefined && (
        <span className="flex shrink-0 items-center gap-1 pr-2 font-display text-lg text-xp" aria-label={`${score} Punkte`}>
          <Icon name="star" size={16} className="fill-xp" /> {score}
        </span>
      )}
      {open && canLookup && <GlossarSheet text={lookup!} onClose={() => toggle(false)} />}
    </header>
  );
}
