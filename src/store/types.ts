import type { LeitnerEntry } from '@/engine/leitner';

export interface DayStats {
  answered: number;
  correct: number;
}

export interface LessonProgress {
  /** 0 = noch nicht geschafft, 1–3 Sterne */
  stars: number;
  /** beste Quote in Prozent */
  best: number;
  /** wie oft geschafft */
  done: number;
}

/** Fortschritt EINER Prüfung – wird getrennt nach pruefungId gespeichert */
export interface PruefungsFortschritt {
  xp: number;
  streak: number;
  bestStreak: number;
  lastDay: string | null;
  /** Leitner-Boxen für Aufgaben UND Lernkarten (nach ID) */
  leitner: Record<string, LeitnerEntry>;
  /** beste Punktzahl je „modusId:kapitelId“ (kapitelId = „alle“ bei allen Kapiteln) */
  bestScores: Record<string, number>;
  /** Bestzeiten (ms) / Bestwerte, bei denen weniger besser ist (z. B. Memory) */
  bestTimes: Record<string, number>;
  badges: string[];
  bestGrade: number | null;
  bestPercent: number | null;
  examAttempts: number;
  rounds: number;
  daily: Record<string, DayStats>;
  /** Lernpfad: Lektionen nach ID */
  lessons: Record<string, LessonProgress>;
}

export const emptyProgress = (): PruefungsFortschritt => ({
  xp: 0,
  streak: 0,
  bestStreak: 0,
  lastDay: null,
  leitner: {},
  bestScores: {},
  bestTimes: {},
  badges: [],
  bestGrade: null,
  bestPercent: null,
  examAttempts: 0,
  rounds: 0,
  daily: {},
  lessons: {},
});
