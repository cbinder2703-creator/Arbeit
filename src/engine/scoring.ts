// Punkte: richtig 100 · Zeitbonus bis +50 (nur mit Zeitlimit) · Combo ×1,5 ab 3 richtigen in Folge.
// Mehrteilige Aufgaben (Sortieren, Vertrag, Lücken …): 100 je richtigem Teil, −50 je Fehler.
export const BASE_POINTS = 100;
export const TIME_BONUS_MAX = 50;
export const COMBO_FROM = 3;
export const COMBO_MULTIPLIER = 1.5;
export const PART_PENALTY = 50;

export interface PartsReport {
  total: number;
  correct: number;
  errors: number;
}

export interface AnswerReport {
  itemId: string;
  /** Aufgabe fehlerfrei gelöst? */
  correct: boolean;
  timeMs: number;
  /** nur Quiz-Blitz: Zeitlimit für den Zeitbonus */
  timeLimitMs?: number;
  /** bei mehrteiligen Aufgaben */
  parts?: PartsReport;
}

export interface ScoreState {
  combo: number;
  total: number;
}

export interface AnswerResult {
  points: number;
  bonus: number;
  multiplier: number;
  combo: number;
  total: number;
}

export const initialScore = (): ScoreState => ({ combo: 0, total: 0 });

export const partsPoints = (p: Pick<PartsReport, 'correct' | 'errors'>): number =>
  Math.max(0, p.correct * BASE_POINTS - p.errors * PART_PENALTY);

export function scoreAnswer(state: ScoreState, r: AnswerReport): { result: AnswerResult; next: ScoreState } {
  const combo = r.correct ? state.combo + 1 : 0;
  const base = r.parts ? partsPoints(r.parts) : r.correct ? BASE_POINTS : 0;
  const bonus =
    r.correct && r.timeLimitMs
      ? Math.round(TIME_BONUS_MAX * Math.max(0, Math.min(1, 1 - r.timeMs / r.timeLimitMs)))
      : 0;
  const multiplier = r.correct && combo >= COMBO_FROM ? COMBO_MULTIPLIER : 1;
  const points = Math.round((base + bonus) * multiplier);
  const total = state.total + points;
  return { result: { points, bonus, multiplier, combo, total }, next: { combo, total } };
}

/** Sterne fürs Ergebnis: Anteil richtig (≥ 90 % → 3, ≥ 60 % → 2, ≥ 1 richtig → 1) */
export function starsFor(correct: number, total: number): number {
  if (total === 0) return 0;
  const f = correct / total;
  if (f >= 0.9) return 3;
  if (f >= 0.6) return 2;
  return f > 0 ? 1 : 0;
}
