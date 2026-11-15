export interface Zone {
  /** −1 … 1, links → rechts */
  x: number;
  /** −1 … 1, unten → oben */
  y: number;
}

/**
 * Lage der Antwort-Felder in einer Fläche (Tor, Ring-Gruppe …): Antwort A oben links, B oben rechts,
 * C unten links, D unten rechts; bei 2 und 3 Antworten sinnvoll verteilt.
 */
export function zonePositions(n: number): Zone[] {
  if (n <= 2) return [{ x: -0.5, y: 0 }, { x: 0.5, y: 0 }].slice(0, Math.max(1, n));
  if (n === 3) return [{ x: -0.6, y: -0.3 }, { x: 0.6, y: -0.3 }, { x: 0, y: 0.5 }];
  return [{ x: -0.5, y: 0.45 }, { x: 0.5, y: 0.45 }, { x: -0.5, y: -0.45 }, { x: 0.5, y: -0.45 }];
}

/** Index des Feldes, das der Position am nächsten liegt */
export function nearestZone(zones: Zone[], x: number, y: number): number {
  let best = 0;
  let bd = Infinity;
  zones.forEach((z, i) => {
    const d = (z.x - x) ** 2 + (z.y - y) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}
