import { shuffle } from './shuffle';
import type { Rng } from './shuffle';
import { nearestZone, zonePositions } from './zones';
import type { Zone } from './zones';

/**
 * Freier Flug: Das Schiff bewegt sich in einer Ebene (x, y ∈ −1…1) auf ein Ziel zu, Felsen müssen umflogen werden,
 * am Ende steht eine Gruppe von Ringen (ein Ring je Antwort). Reine Logik; `d` = Entfernung vor dem Schiff in Metern.
 */
export interface Rock {
  d: number;
  x: number;
  y: number;
  r: number;
  hit: boolean;
}

export interface Flight {
  zones: Zone[];
  x: number;
  y: number;
  tx: number;
  ty: number;
  rocks: Rock[];
  gate: number;
  speed: number;
  resolved: number | null;
}

export type FlightEvent = { type: 'hit'; rock: Rock } | { type: 'gate'; choice: number };

export const SHIP_RADIUS = 0.12;
export const HIT_DEPTH = 1.0; // Meter
export const MOVE_SPEED = 1.9; // Einheiten pro Sekunde

export interface FlightOptions {
  speed?: number;
  gateDist?: number;
  rng?: Rng;
}

export function makeFlight(n: number, opts: FlightOptions = {}): Flight {
  const { speed = 10, gateDist = 70, rng = Math.random } = opts;
  const zones = zonePositions(n);
  const rocks: Rock[] = [];
  // Felsen: alle ca. 9 m ein Fels, abwechselnd links/rechts/Mitte, nie genau in der Nähe der Spielerposition (0,0)
  const sides = shuffle([-0.6, 0, 0.6, -0.3, 0.3], rng);
  let k = 0;
  for (let d = 20; d < gateDist - 12; d += 9) {
    const x = sides[k % sides.length] + (rng() - 0.5) * 0.25;
    const y = (rng() - 0.5) * 1.3;
    rocks.push({ d, x: Math.max(-0.85, Math.min(0.85, x)), y: Math.max(-0.75, Math.min(0.75, y)), r: 0.16 + rng() * 0.06, hit: false });
    k++;
  }
  return { zones, x: 0, y: 0, tx: 0, ty: 0, rocks, gate: gateDist, speed, resolved: null };
}

export function setTarget(f: Flight, x: number, y: number): void {
  f.tx = Math.max(-1, Math.min(1, x));
  f.ty = Math.max(-0.9, Math.min(0.9, y));
}

export const nearest = (f: Flight): number => nearestZone(f.zones, f.x, f.y);

export function stepFlight(f: Flight, dt: number): FlightEvent[] {
  if (f.resolved !== null) return [];
  const events: FlightEvent[] = [];
  const dx = f.tx - f.x;
  const dy = f.ty - f.y;
  const dist = Math.hypot(dx, dy);
  const step = MOVE_SPEED * dt;
  if (dist <= step) {
    f.x = f.tx;
    f.y = f.ty;
  } else {
    f.x += (dx / dist) * step;
    f.y += (dy / dist) * step;
  }
  const dd = f.speed * dt;
  for (const r of f.rocks) {
    r.d -= dd;
    if (!r.hit && Math.abs(r.d) < HIT_DEPTH && Math.hypot(r.x - f.x, r.y - f.y) < r.r + SHIP_RADIUS) {
      r.hit = true;
      events.push({ type: 'hit', rock: r });
    }
  }
  f.gate -= dd;
  if (f.gate <= 0) {
    f.resolved = nearest(f);
    events.push({ type: 'gate', choice: f.resolved });
  }
  return events;
}
