import { shuffle } from '@/engine/shuffle';
import type { Rng } from '@/engine/shuffle';

/** Reine Spiellogik der Burg-Wacht: Gegner marschieren in 4 Spuren auf die Burg zu, Türme (Stufe 0–3) schießen. */
export const LANES = 4;
export const LANE_LEN = 290; // Länge einer Spur in Spiel-Einheiten (= Pixel in der Darstellung)
export const CASTLE_HP = 5;
export const MAX_LEVEL = 3;
/** Sekunden zwischen zwei Schüssen je Turmstufe (Stufe 0 = kein Turm) */
export const FIRE_EVERY = [Infinity, 1.3, 0.8, 0.5] as const;

export interface Enemy {
  id: number;
  lane: number;
  /** Abstand zur Burg */
  x: number;
  hp: number;
  maxHp: number;
  speed: number;
  kind: number;
}
export interface Shot {
  lane: number;
  x: number;
  age: number;
}
export interface Defense {
  enemies: Enemy[];
  towers: number[];
  cool: number[];
  castle: number;
  /** noch nicht gestartete Gegner: Wartezeit bis zum Auftauchen */
  queue: { wait: number; lane: number; hp: number; speed: number; kind: number }[];
  shots: Shot[];
  nextId: number;
  time: number;
  killed: number;
}

export function makeDefense(): Defense {
  return { enemies: [], towers: [0, 1, 1, 0], cool: [0, 0, 0, 0], castle: CASTLE_HP, queue: [], shots: [], nextId: 1, time: 0, killed: 0 };
}

export const waveSize = (wave: number): number => 2 + Math.floor(wave / 3);
export const waveHp = (wave: number): number => (wave < 4 ? 2 : wave < 8 ? 3 : 4);

/** Eine Welle (Nr. `wave`, ab 0): Gegner tauchen nacheinander in zufälligen Spuren auf */
export function queueWave(d: Defense, wave: number, speed: number, rng: Rng = Math.random): void {
  const n = waveSize(wave);
  let prev = -1;
  const startWait = d.queue.length ? Math.max(...d.queue.map((q) => q.wait)) + 2 : 0.5;
  for (let i = 0; i < n; i++) {
    const lane = shuffle([0, 1, 2, 3], rng).find((l) => l !== prev)!;
    prev = lane;
    d.queue.push({ wait: startWait + i * 2.3, lane, hp: waveHp(wave), speed, kind: Math.floor(rng() * 4) });
  }
}

/** Strafe für eine falsche Antwort: zwei zusätzliche, schnellere Gegner */
export function punish(d: Defense, wave: number, speed: number, rng: Rng = Math.random): void {
  let prev = -1;
  for (let i = 0; i < 2; i++) {
    const lane = shuffle([0, 1, 2, 3], rng).find((l) => l !== prev)!;
    prev = lane;
    d.queue.push({ wait: 1 + i * 1.6, lane, hp: waveHp(wave), speed: speed * 1.25, kind: Math.floor(rng() * 4) });
  }
}

export function upgrade(d: Defense, lane: number): boolean {
  if (lane < 0 || lane >= LANES || d.towers[lane] >= MAX_LEVEL) return false;
  d.towers[lane] += 1;
  d.cool[lane] = Math.min(d.cool[lane], 0.3); // frisch gebaut → gleich bereit
  return true;
}

export const idle = (d: Defense): boolean => d.enemies.length === 0 && d.queue.length === 0;

export function stepDefense(d: Defense, dt: number): void {
  d.time += dt;
  for (const q of d.queue) q.wait -= dt;
  const ready = d.queue.filter((q) => q.wait <= 0);
  d.queue = d.queue.filter((q) => q.wait > 0);
  for (const q of ready) d.enemies.push({ id: d.nextId++, lane: q.lane, x: LANE_LEN, hp: q.hp, maxHp: q.hp, speed: q.speed, kind: q.kind });

  for (const e of d.enemies) e.x -= e.speed * dt;

  for (let l = 0; l < LANES; l++) {
    const lvl = d.towers[l];
    if (lvl === 0) continue;
    d.cool[l] -= dt;
    if (d.cool[l] > 0) continue;
    // vorderster Gegner dieser Spur (am nächsten zur Burg)
    let target: Enemy | undefined;
    for (const e of d.enemies) if (e.lane === l && e.hp > 0 && (!target || e.x < target.x)) target = e;
    if (!target) {
      d.cool[l] = 0;
      continue;
    }
    target.hp -= 1;
    d.shots.push({ lane: l, x: target.x, age: 0 });
    d.cool[l] = FIRE_EVERY[lvl];
    if (target.hp <= 0) d.killed += 1;
  }

  for (const e of d.enemies) {
    if (e.hp > 0 && e.x <= 0) {
      d.castle = Math.max(0, d.castle - 1);
      e.hp = 0;
    }
  }
  d.enemies = d.enemies.filter((e) => e.hp > 0);
  for (const s of d.shots) s.age += dt;
  d.shots = d.shots.filter((s) => s.age < 0.18);
}
