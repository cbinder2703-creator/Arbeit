import { describe, expect, it } from 'vitest';
import { makeFlight, nearest, setTarget, stepFlight } from './spaceRun';
import { nearestZone, zonePositions } from './zones';
import { mulberry32 } from './shuffle';

const fly = (f: ReturnType<typeof makeFlight>, secs: number) => {
  const ev = [];
  for (let t = 0; t < secs / 0.05 && f.resolved === null; t++) ev.push(...stepFlight(f, 0.05));
  return ev;
};

describe('Felder', () => {
  it('2, 3 und 4 Antworten bekommen so viele Felder; bei 4: A oben links, D unten rechts', () => {
    expect(zonePositions(2)).toHaveLength(2);
    expect(zonePositions(3)).toHaveLength(3);
    const z = zonePositions(4);
    expect(z[0].x).toBeLessThan(0);
    expect(z[0].y).toBeGreaterThan(0);
    expect(z[3].x).toBeGreaterThan(0);
    expect(z[3].y).toBeLessThan(0);
  });
  it('nearestZone findet das nächste Feld', () => {
    const z = zonePositions(4);
    expect(nearestZone(z, -0.9, 0.9)).toBe(0);
    expect(nearestZone(z, 0.9, -0.9)).toBe(3);
  });
});

describe('Raumflug: Logik', () => {
  it('das Schiff fliegt zum Ziel (begrenzte Geschwindigkeit) und bleibt im Raum', () => {
    const f = makeFlight(4, { rng: mulberry32(1) });
    setTarget(f, 5, 5);
    expect(f.tx).toBe(1);
    stepFlight(f, 0.1);
    expect(f.x).toBeCloseTo(0.19 * (1 / Math.hypot(1, 0.9)), 1);
    fly(f, 2);
    expect(f.resolved).toBeNull(); // noch nicht am Tor
  });

  it('am Tor zählt der Ring, dem das Schiff am nächsten ist', () => {
    for (let c = 0; c < 4; c++) {
      const f = makeFlight(4, { rng: mulberry32(c + 3) });
      f.rocks = [];
      setTarget(f, f.zones[c].x, f.zones[c].y);
      const gate = fly(f, 30).find((e) => e.type === 'gate');
      expect(gate).toEqual({ type: 'gate', choice: c });
      expect(nearest(f)).toBe(c);
    }
  });

  it('ein Felsen auf dem Weg ist ein Treffer – genau einmal; ausweichen verhindert ihn', () => {
    const f = makeFlight(4, { rng: mulberry32(2) });
    f.rocks = [{ d: 10, x: 0, y: 0, r: 0.2, hit: false }];
    expect(fly(f, 30).filter((e) => e.type === 'hit')).toHaveLength(1);
    const g = makeFlight(4, { rng: mulberry32(2) });
    g.rocks = [{ d: 10, x: 0, y: 0, r: 0.2, hit: false }];
    setTarget(g, 0.8, 0.8);
    for (let i = 0; i < 40; i++) stepFlight(g, 0.05); // erst wegfliegen …
    expect(g.rocks[0].hit).toBe(false);
  });

  it('Felsen liegen in jeder Runde im erlaubten Bereich', () => {
    for (let s = 1; s < 30; s++) {
      const f = makeFlight(4, { rng: mulberry32(s) });
      expect(f.rocks.length).toBeGreaterThan(3);
      for (const r of f.rocks) {
        expect(Math.abs(r.x)).toBeLessThanOrEqual(0.85);
        expect(Math.abs(r.y)).toBeLessThanOrEqual(0.75);
      }
    }
  });
});
