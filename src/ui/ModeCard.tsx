import { Link } from 'react-router-dom';
import type { GameMode } from '@/modes/types';
import { Icon } from './Icon';

export function ModeCard({
  mode,
  to,
  available,
  best,
}: {
  mode: GameMode;
  to: string;
  available: boolean;
  best?: number;
}) {
  const inner = (
    <>
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ color: mode.color, background: `${mode.color}26` }}
      >
        <Icon name={mode.icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-[15px] leading-tight">{mode.title}</span>
        <span className="block text-xs leading-snug text-mute">{mode.tagline}</span>
        {best !== undefined && best > 0 && <span className="mt-0.5 block text-[11px] font-bold text-xp">Bestwert {best}</span>}
        {!available && <span className="mt-0.5 block text-[11px] text-mute/80">Zu wenig Aufgaben in dieser Auswahl</span>}
      </span>
    </>
  );
  const cls = 'flex min-h-[64px] items-center gap-3 rounded-2xl bg-card p-3 text-left';
  return available ? (
    <Link to={to} className={`${cls} transition hover:bg-card-hi active:scale-[0.99]`}>
      {inner}
    </Link>
  ) : (
    <div className={`${cls} opacity-45`} aria-disabled="true">
      {inner}
    </div>
  );
}
