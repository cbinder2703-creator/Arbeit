import type { Rng } from '@/engine/shuffle';

/**
 * Wohin springt der Torwart? Falsche Antwort → er ahnt die Ecke und hält. Richtige Antwort → er springt
 * in eine andere Ecke (Tor!). Bei nur einem Feld gibt es keine „andere“ Ecke.
 */
export function keeperZone(n: number, chosen: number, ok: boolean, rng: Rng = Math.random): number {
  if (!ok || n <= 1) return chosen;
  const others = Array.from({ length: n }, (_, i) => i).filter((i) => i !== chosen);
  return others[Math.floor(rng() * others.length)];
}

/** Ab wie vielen Toren gilt die Runde als gewonnen (60 %, aufgerundet) */
export const goalsToWin = (shots: number): number => Math.ceil(shots * 0.6);
