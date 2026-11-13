import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, dayString } from '@/engine/dates';
import { nextLeitner } from '@/engine/leitner';
import { emptyProgress } from './types';
import type { PruefungsFortschritt } from './types';

interface ProgressState {
  byPruefung: Record<string, PruefungsFortschritt>;
  /** Tages-Streak über alle Prüfungen */
  globalStreak: number;
  bestGlobalStreak: number;
  globalLastDay: string | null;

  recordAnswer: (pid: string, itemId: string, correct: boolean, today?: string) => void;
  addXp: (pid: string, xp: number) => void;
  recordRound: (pid: string, key: string, score: number) => void;
  recordBestTime: (pid: string, key: string, value: number) => void;
  addBadges: (pid: string, ids: string[]) => void;
  recordExam: (pid: string, percent: number, grade: number) => void;
  recordLesson: (pid: string, lessonId: string, stars: number, percent: number) => void;
  resetPruefung: (pid: string) => void;
  resetAll: () => void;
}

/** Fehlende Felder (ältere Speicherstände) mit Standardwerten auffüllen */
const fill = (p: Partial<PruefungsFortschritt> | undefined): PruefungsFortschritt => ({ ...emptyProgress(), ...p });
const get = (s: ProgressState, pid: string): PruefungsFortschritt => fill(s.byPruefung[pid]);

/** Streak für einen Tag fortschreiben */
function touchDay(count: number, last: string | null, today: string): { count: number; last: string } {
  if (last === today) return { count: Math.max(1, count), last };
  if (last === addDays(today, -1)) return { count: count + 1, last: today };
  return { count: 1, last: today };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      byPruefung: {},
      globalStreak: 0,
      bestGlobalStreak: 0,
      globalLastDay: null,

      recordAnswer: (pid, itemId, correct, today = dayString()) =>
        set((s) => {
          const cur = get(s, pid);
          const day = cur.daily[today] ?? { answered: 0, correct: 0 };
          const st = touchDay(cur.streak, cur.lastDay, today);
          const gs = touchDay(s.globalStreak, s.globalLastDay, today);
          return {
            globalStreak: gs.count,
            bestGlobalStreak: Math.max(s.bestGlobalStreak, gs.count),
            globalLastDay: gs.last,
            byPruefung: {
              ...s.byPruefung,
              [pid]: {
                ...cur,
                streak: st.count,
                bestStreak: Math.max(cur.bestStreak, st.count),
                lastDay: st.last,
                leitner: { ...cur.leitner, [itemId]: nextLeitner(cur.leitner[itemId], correct, today) },
                daily: {
                  ...cur.daily,
                  [today]: { answered: day.answered + 1, correct: day.correct + (correct ? 1 : 0) },
                },
              },
            },
          };
        }),

      addXp: (pid, xp) =>
        set((s) => ({ byPruefung: { ...s.byPruefung, [pid]: { ...get(s, pid), xp: get(s, pid).xp + Math.max(0, xp) } } })),

      recordRound: (pid, key, score) =>
        set((s) => {
          const cur = get(s, pid);
          return {
            byPruefung: {
              ...s.byPruefung,
              [pid]: {
                ...cur,
                rounds: cur.rounds + 1,
                bestScores: { ...cur.bestScores, [key]: Math.max(cur.bestScores[key] ?? 0, score) },
              },
            },
          };
        }),

      recordBestTime: (pid, key, value) =>
        set((s) => {
          const cur = get(s, pid);
          const old = cur.bestTimes[key];
          if (old !== undefined && old <= value) return s;
          return { byPruefung: { ...s.byPruefung, [pid]: { ...cur, bestTimes: { ...cur.bestTimes, [key]: value } } } };
        }),

      addBadges: (pid, ids) =>
        set((s) => {
          const cur = get(s, pid);
          const fresh = [...new Set(ids)].filter((id) => !cur.badges.includes(id));
          if (!fresh.length) return s;
          return { byPruefung: { ...s.byPruefung, [pid]: { ...cur, badges: [...cur.badges, ...fresh] } } };
        }),

      recordExam: (pid, percent, grade) =>
        set((s) => {
          const cur = get(s, pid);
          return {
            byPruefung: {
              ...s.byPruefung,
              [pid]: {
                ...cur,
                examAttempts: cur.examAttempts + 1,
                bestGrade: cur.bestGrade === null ? grade : Math.min(cur.bestGrade, grade),
                bestPercent: cur.bestPercent === null ? percent : Math.max(cur.bestPercent, percent),
              },
            },
          };
        }),

      recordLesson: (pid, lessonId, stars, percent) =>
        set((s) => {
          const cur = get(s, pid);
          const old = cur.lessons[lessonId];
          return {
            byPruefung: {
              ...s.byPruefung,
              [pid]: {
                ...cur,
                lessons: {
                  ...cur.lessons,
                  [lessonId]: { stars: Math.max(old?.stars ?? 0, stars), best: Math.max(old?.best ?? 0, percent), done: (old?.done ?? 0) + (stars > 0 ? 1 : 0) },
                },
              },
            },
          };
        }),

      resetPruefung: (pid) =>
        set((s) => {
          const rest = { ...s.byPruefung };
          delete rest[pid];
          return { byPruefung: rest };
        }),

      resetAll: () => set({ byPruefung: {}, globalStreak: 0, bestGlobalStreak: 0, globalLastDay: null }),
    }),
    {
      name: 'azubiquest-progress',
      version: 2,
      // ältere Speicherstände bekommen neue Felder (z. B. Lektionen) automatisch
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProgressState>;
        return { ...current, ...p, byPruefung: Object.fromEntries(Object.entries(p.byPruefung ?? {}).map(([k, v]) => [k, fill(v)])) };
      },
      partialize: (s) => ({
        byPruefung: s.byPruefung,
        globalStreak: s.globalStreak,
        bestGlobalStreak: s.bestGlobalStreak,
        globalLastDay: s.globalLastDay,
      }),
    },
  ),
);

/** Fortschritt einer Prüfung (leer, wenn noch nichts gespielt wurde) */
export function useFortschritt(pid: string | undefined): PruefungsFortschritt {
  const p = useProgress((s) => (pid ? s.byPruefung[pid] : undefined));
  return p ? (p.lessons ? p : fill(p)) : EMPTY;
}
const EMPTY = emptyProgress();

export const getFortschritt = (pid: string): PruefungsFortschritt => fill(useProgress.getState().byPruefung[pid]);
