import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Icon } from '@/ui/Icon';
import { useFortschritt } from '@/store/progress';
import { levelOf } from '@/engine/stats';
import { usePruefung } from './pruefungContext';
import { ProgressBar } from '@/ui/ProgressBar';

/** Prüfungs-Layout: eigener Kopfbereich + Navigation (mobil unten, ab 1024 px Sidebar) */
export function PruefungsShell({ children, hero = false }: { children: ReactNode; hero?: boolean }) {
  const { meta } = usePruefung();
  const base = `/p/${meta.id}`;
  const fort = useFortschritt(meta.id);
  const lvl = levelOf(fort);
  const items = [
    { to: base, label: 'Start', icon: 'home', end: true },
    { to: `${base}/modi`, label: 'Spielmodi', icon: 'gamepad', end: false },
    { to: `${base}/karten`, label: 'Karten', icon: 'layers', end: false },
    { to: `${base}/abschluss`, label: 'Prüfung', icon: 'crown', end: false },
  ];

  return (
    <div className="min-h-dvh lg:flex">
      {/* Sidebar ab 1024 px */}
      <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-line bg-card/40 p-5 lg:flex">
        <Link to="/" className="tap flex items-center gap-1 text-sm font-semibold text-mute hover:text-ink">
          <Icon name="chevron-left" size={16} /> Meine Prüfungen
        </Link>
        <div className="mt-5 flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-p text-white">
            <Icon name={meta.icon} size={26} />
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-xl leading-tight">{meta.gameTitle}</div>
            <div className="truncate text-xs text-mute">{meta.title}</div>
          </div>
        </div>
        <nav className="mt-6 flex flex-col gap-1" aria-label="Spielnavigation">
          {[...items, { to: '/profil', label: 'Profil', icon: 'user', end: false }].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `tap flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold ${isActive ? 'bg-p/20 text-p-accent' : 'text-mute hover:bg-card-hi/60 hover:text-ink'}`
              }
            >
              <Icon name={n.icon} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-card p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">Level {lvl.level}</span>
            <span className="text-xs text-mute">{lvl.into} / {lvl.needed} XP</span>
          </div>
          <ProgressBar percent={(lvl.into / lvl.needed) * 100} className="mt-2" height={6} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {!hero && (
          <header className="pattern-bg sticky top-0 z-20 flex items-center gap-2 bg-gradient-to-r from-p to-[var(--p-dark)] px-2 pb-2 pt-[calc(var(--safe-top)+0.5rem)] text-white lg:hidden">
            <Link to="/" className="tap grid place-items-center rounded-xl hover:bg-white/10" aria-label="Zurück zu Meine Prüfungen">
              <Icon name="chevron-left" size={22} />
            </Link>
            <span className="truncate font-display text-lg">{meta.gameTitle}</span>
            {fort.streak > 0 && (
              <span className="ml-auto mr-2 inline-flex items-center gap-1 rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold">
                <Icon name="flame" size={14} /> {fort.streak} {fort.streak === 1 ? 'Tag' : 'Tage'}
              </span>
            )}
          </header>
        )}
        <main className="pb-32 lg:pb-12">{children}</main>
      </div>

      {/* Bottom-Nav mobil */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg/95 pb-[var(--safe-bottom)] backdrop-blur lg:hidden"
        aria-label="Spielnavigation"
      >
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `tap flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-p-accent' : 'text-mute'}`
            }
          >
            <Icon name={n.icon} />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
