import { createContext, useContext } from 'react';
import type { Pruefung } from '@/content/parse';

export const PruefungContext = createContext<Pruefung | null>(null);

export function usePruefung(): Pruefung {
  const p = useContext(PruefungContext);
  if (!p) throw new Error('usePruefung außerhalb einer Prüfungs-Route');
  return p;
}

/** Wie usePruefung, aber ohne Fehler außerhalb einer Prüfungs-Route (z. B. in Tests einzelner Modi) */
export const useOptionalPruefung = (): Pruefung | null => useContext(PruefungContext);
