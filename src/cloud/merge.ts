// Zusammenführen von Fortschritt (Gerät ↔ Cloud). Jeder Stand wächst nur, deshalb gilt je Wert der „bessere“.
// Ein Zurücksetzen (resetAt) gewinnt gegen ältere Stände anderer Geräte.
import type { PruefungsFortschritt } from '@/store/types';
import { emptyProgress } from '@/store/types';

export interface SyncState {
  byPruefung: Record<string, PruefungsFortschritt>;
  globalStreak: number;
  bestGlobalStreak: number;
  globalLastDay: string | null;
  globalResetAt?: number;
}

export interface SyncPayload extends SyncState {
  v: 1;
}

const maxNum = (a: number | null, b: number | null): number | null => (a === null ? b : b === null ? a : Math.max(a, b));
const minNum = (a: number | null, b: number | null): number | null => (a === null ? b : b === null ? a : Math.min(a, b));
const later = (a: string | null, b: string | null): string | null => (a === null ? b : b === null ? a : a >= b ? a : b);

function mergeRecord<T>(a: Record<string, T>, b: Record<string, T>, pick: (x: T, y: T) => T): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = k in a ? pick(a[k], v) : v;
  return out;
}

export function mergeFortschritt(x: PruefungsFortschritt | undefined, y: PruefungsFortschritt | undefined): PruefungsFortschritt {
  if (!x) return y ?? emptyProgress();
  if (!y) return x;
  const rx = x.resetAt ?? 0;
  const ry = y.resetAt ?? 0;
  if (rx !== ry) return rx > ry ? x : y; // zurückgesetzter Stand gewinnt
  const a = { ...emptyProgress(), ...x };
  const b = { ...emptyProgress(), ...y };
  const sameDay = a.lastDay === b.lastDay;
  const aNewer = (a.lastDay ?? '') >= (b.lastDay ?? '');
  return {
    resetAt: rx,
    xp: Math.max(a.xp, b.xp),
    streak: sameDay ? Math.max(a.streak, b.streak) : aNewer ? a.streak : b.streak,
    bestStreak: Math.max(a.bestStreak, b.bestStreak),
    lastDay: later(a.lastDay, b.lastDay),
    leitner: mergeRecord(a.leitner, b.leitner, (p, q) => (q.seen > p.seen || (q.seen === p.seen && q.due > p.due) ? q : p)),
    bestScores: mergeRecord(a.bestScores, b.bestScores, Math.max),
    bestTimes: mergeRecord(a.bestTimes, b.bestTimes, Math.min),
    badges: [...new Set([...a.badges, ...b.badges])],
    bestGrade: minNum(a.bestGrade, b.bestGrade),
    bestPercent: maxNum(a.bestPercent, b.bestPercent),
    examAttempts: Math.max(a.examAttempts, b.examAttempts),
    rounds: Math.max(a.rounds, b.rounds),
    daily: mergeRecord(a.daily, b.daily, (p, q) => ({ answered: Math.max(p.answered, q.answered), correct: Math.max(p.correct, q.correct) })),
    lessons: mergeRecord(a.lessons ?? {}, b.lessons ?? {}, (p, q) => ({ stars: Math.max(p.stars, q.stars), best: Math.max(p.best, q.best), done: Math.max(p.done, q.done) })),
  };
}

export function mergeProgress(local: SyncState, remote: SyncState | null): SyncState {
  if (!remote) return local;
  const byPruefung: Record<string, PruefungsFortschritt> = {};
  for (const id of new Set([...Object.keys(local.byPruefung), ...Object.keys(remote.byPruefung)])) {
    byPruefung[id] = mergeFortschritt(local.byPruefung[id], remote.byPruefung[id]);
  }
  const rl = local.globalResetAt ?? 0;
  const rr = remote.globalResetAt ?? 0;
  let g: Pick<SyncState, 'globalStreak' | 'bestGlobalStreak' | 'globalLastDay'>;
  if (rl !== rr) {
    const w = rl > rr ? local : remote;
    g = { globalStreak: w.globalStreak, bestGlobalStreak: w.bestGlobalStreak, globalLastDay: w.globalLastDay };
  } else {
    const l = (local.globalLastDay ?? '') >= (remote.globalLastDay ?? '') ? local : remote;
    g = {
      globalStreak: local.globalLastDay === remote.globalLastDay ? Math.max(local.globalStreak, remote.globalStreak) : l.globalStreak,
      bestGlobalStreak: Math.max(local.bestGlobalStreak, remote.bestGlobalStreak),
      globalLastDay: later(local.globalLastDay, remote.globalLastDay),
    };
  }
  return { byPruefung, ...g, globalResetAt: Math.max(rl, rr) };
}

/** Eine Cloud-Zeile ist nur brauchbar, wenn sie wie ein Fortschritt aussieht */
export function parsePayload(raw: unknown): SyncState | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<SyncPayload>;
  if (r.v !== 1 || typeof r.byPruefung !== 'object' || r.byPruefung === null) return null;
  return {
    byPruefung: r.byPruefung,
    globalStreak: typeof r.globalStreak === 'number' ? r.globalStreak : 0,
    bestGlobalStreak: typeof r.bestGlobalStreak === 'number' ? r.bestGlobalStreak : 0,
    globalLastDay: typeof r.globalLastDay === 'string' ? r.globalLastDay : null,
    globalResetAt: typeof r.globalResetAt === 'number' ? r.globalResetAt : 0,
  };
}
