import type { ReactNode } from 'react';
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
}: {
  onClose: () => void;
  current: number;
  total: number;
  score?: number;
  right?: ReactNode;
  title?: string;
  exam?: { index: number; total: number };
}) {
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
    </header>
  );
}
