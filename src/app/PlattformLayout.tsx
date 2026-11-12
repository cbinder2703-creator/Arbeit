import { NavLink, Outlet, Link } from 'react-router-dom';
import { Icon } from '@/ui/Icon';

const NAV = [
  { to: '/', label: 'Prüfungen', icon: 'gamepad', end: true },
  { to: '/profil', label: 'Profil', icon: 'user', end: false },
];

function Logo() {
  return (
    <Link to="/" className="tap flex items-center gap-2.5" aria-label="AzubiQuest – Startseite">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-xp text-[#1a1400]">
        <Icon name="rocket" size={22} />
      </span>
      <span className="font-display text-xl">AzubiQuest</span>
    </Link>
  );
}

/** Neutrales Plattform-Layout („Meine Prüfungen“, Profil, Rechtliches) */
export function PlattformLayout() {
  return (
    <div className="min-h-dvh bg-bg lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-card/40 p-5 lg:flex">
        <Logo />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Hauptnavigation">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `tap flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold ${isActive ? 'bg-card-hi text-xp' : 'text-mute hover:text-ink hover:bg-card-hi/60'}`
              }
            >
              <Icon name={n.icon} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex gap-2 text-xs text-mute">
          <Link to="/impressum" className="tap inline-flex items-center px-2 hover:text-ink">Impressum</Link>
          <Link to="/datenschutz" className="tap inline-flex items-center px-2 hover:text-ink">Datenschutz</Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between px-4 pt-[calc(var(--safe-top)+1rem)] lg:hidden">
          <Logo />
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-5 lg:px-10 lg:pb-12 lg:pt-10">
          <Outlet />
          <footer className="mt-12 flex justify-center gap-3 text-xs text-mute lg:hidden">
            <Link to="/impressum" className="tap inline-flex items-center px-3">Impressum</Link>
            <Link to="/datenschutz" className="tap inline-flex items-center px-3">Datenschutz</Link>
          </footer>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg/95 pb-[var(--safe-bottom)] backdrop-blur lg:hidden"
        aria-label="Hauptnavigation"
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `tap flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? 'text-xp' : 'text-mute'}`
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
