import { shuffle } from './shuffle';
import type { Rng } from './shuffle';

/**
 * Spur-Lauf: Du läufst/fährst geradeaus, die Strecke hat 2–4 Spuren. Hindernisse müssen umfahren werden,
 * am Ende steht ein Tor mit einer Antwort pro Spur (Spur i = Antwort i). Reine Logik, ohne Darstellung –
 * Strecken-Einheit ist „Meter“, `d` ist die Entfernung vor dem Spieler (0 = auf Höhe des Spielers).
 */
export interface Obstacle {
  d: number;
  lane: number;
  hit: boolean;
}

export interface Round {
  lanes: number;
  lane: number;
  obstacles: Obstacle[];
  /** Entfernung zum Antwort-Tor */
  gate: number;
  speed: number;
  /** gewählte Antwort (Spur beim Durchfahren), sobald das Tor passiert ist */
  resolved: number | null;
}

export type RunEvent = { type: 'hit'; obstacle: Obstacle } | { type: 'gate'; choice: number };

export const HIT_RADIUS = 1.1; // Meter
export const OBSTACLE_START = 22;
export const OBSTACLE_GAP = 11;

export interface RoundOptions {
  speed?: number; // m/s
  gateDist?: number; // m
  startLane?: number;
  rng?: Rng;
}

export function makeRound(lanes: number, opts: RoundOptions = {}): Round {
  const { speed = 9, gateDist = 62, rng = Math.random } = opts;
  const lane = Math.min(lanes - 1, opts.startLane ?? Math.floor(lanes / 2));
  const obstacles: Obstacle[] = [];
  let prev = -1;
  for (let d = OBSTACLE_START; d < gateDist - 12; d += OBSTACLE_GAP) {
    // nie dieselbe Spur direkt hintereinander und nie alle Spuren zugleich blockiert
    const options = shuffle(Array.from({ length: lanes }, (_, i) => i), rng).filter((l) => l !== prev);
    const l = options[0];
    obstacles.push({ d, lane: l, hit: false });
    prev = l;
  }
  return { lanes, lane, obstacles, gate: gateDist, speed, resolved: null };
}

export function setLane(r: Round, lane: number): void {
  r.lane = Math.max(0, Math.min(r.lanes - 1, lane));
}

export const moveLane = (r: Round, delta: number): void => setLane(r, r.lane + delta);

/** Ein Schritt: alles rückt näher; liefert Ereignisse (Treffer, Tor durchfahren) */
export function stepRound(r: Round, dt: number): RunEvent[] {
  if (r.resolved !== null) return [];
  const events: RunEvent[] = [];
  const dd = r.speed * dt;
  for (const o of r.obstacles) {
    o.d -= dd;
    // Treffer: Hindernis liegt gerade auf Höhe des Spielers (±Radius) – in dessen Spur
    if (!o.hit && o.lane === r.lane && Math.abs(o.d) < HIT_RADIUS) {
      o.hit = true;
      events.push({ type: 'hit', obstacle: o });
    }
  }
  r.gate -= dd;
  if (r.gate <= 0) {
    r.resolved = r.lane;
    events.push({ type: 'gate', choice: r.lane });
  }
  return events;
}

/** Wie viele Spuren eine Frage braucht: so viele wie Antworten (2–4) */
export const lanesFor = (choices: number): number => Math.max(2, Math.min(4, choices));
