import type { BadgeDef } from '@/content/schema';
import { Icon } from './Icon';

/** Abzeichen einer Prüfung: erreicht = leuchtend, sonst gesperrt mit Regeltext */
export function BadgeList({ badges, earned }: { badges: BadgeDef[]; earned: string[] }) {
  if (!badges.length) return null;
  return (
    <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((b) => {
        const has = earned.includes(b.id);
        return (
          <li
            key={b.id}
            data-earned={has}
            className={`flex items-center gap-3 rounded-2xl border p-3 ${has ? 'border-xp/50 bg-xp/10' : 'border-line bg-card opacity-70'}`}
          >
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${has ? 'bg-xp text-[#1a1400]' : 'bg-card-hi text-mute'}`}>
              <Icon name={has ? 'medal' : 'lock'} size={22} />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-[15px] leading-tight">{b.title}</span>
              <span className="block text-xs text-mute">{b.rule}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
