import { createContext, useContext } from 'react';

/** Läuft ein Modus innerhalb einer Folge von Aufgaben (Lektion, Abschlussprüfung, „Fehler üben“)? */
export interface SequenceInfo {
  /** 1-basiert */
  index: number;
  total: number;
  /** Beschriftung des letzten „Weiter“-Knopfs dieser Aufgabe */
  lastLabel: string;
}

export const SequenceContext = createContext<SequenceInfo | null>(null);
export const useSequence = (): SequenceInfo | null => useContext(SequenceContext);
/** Beschriftung für den Knopf nach der letzten Aufgabe eines Modus */
export const useFinishLabel = (): string => useContext(SequenceContext)?.lastLabel ?? 'Ergebnis ansehen';
