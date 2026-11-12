import { addDays } from './dates';

/** fällig nach 0 / 1 / 3 / 7 / 14 Tagen (Box 1 … 5) */
export const INTERVAL_DAYS = [0, 1, 3, 7, 14] as const;
export const MAX_BOX = 5;

export interface LeitnerEntry {
  box: number; // 1–5
  due: string; // Tag, ab dem wieder fällig
  seen: number;
  wrong: number;
  everCorrect: boolean;
}

/** richtig → eine Box weiter, falsch → zurück in Box 1 */
export function nextLeitner(prev: LeitnerEntry | undefined, correct: boolean, today: string): LeitnerEntry {
  const box = correct ? Math.min(MAX_BOX, (prev?.box ?? 0) + 1) : 1;
  return {
    box,
    due: addDays(today, INTERVAL_DAYS[box - 1]),
    seen: (prev?.seen ?? 0) + 1,
    wrong: (prev?.wrong ?? 0) + (correct ? 0 : 1),
    everCorrect: (prev?.everCorrect ?? false) || correct,
  };
}

export const isDue = (e: LeitnerEntry | undefined, today: string): boolean => !!e && e.due <= today;
