import { Outlet, useParams } from 'react-router-dom';
import { getPruefung } from '@/content/loader';
import { PruefungsTheme } from '@/ui/PruefungsTheme';
import { PruefungContext } from './pruefungContext';
import { NotFound } from '@/pages/NotFound';

/** Route /p/:pruefungId – lädt die Prüfung und setzt ihr Thema (Farben, Muster) für alles darunter */
export function PruefungRoute() {
  const { pruefungId } = useParams();
  const p = getPruefung(pruefungId);
  if (!p) return <NotFound what="Diese Prüfung" />;
  return (
    <PruefungContext.Provider value={p}>
      <PruefungsTheme meta={p.meta}>
        <Outlet />
      </PruefungsTheme>
    </PruefungContext.Provider>
  );
}
