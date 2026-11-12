/** XP, die nötig sind, um Level n abzuschließen (n → n+1): 100 · n^1,4 */
export const xpForLevel = (n: number): number => Math.round(100 * Math.pow(n, 1.4));

export const xpFromPoints = (points: number): number => Math.floor(Math.max(0, points) / 10);

export interface LevelInfo {
  level: number;
  /** XP innerhalb des aktuellen Levels */
  into: number;
  /** XP, die das aktuelle Level insgesamt braucht */
  needed: number;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let rest = Math.max(0, xp);
  while (rest >= xpForLevel(level)) {
    rest -= xpForLevel(level);
    level++;
  }
  return { level, into: rest, needed: xpForLevel(level) };
}
