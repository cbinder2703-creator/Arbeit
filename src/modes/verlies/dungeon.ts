import { shuffle } from '@/engine/shuffle';
import type { Rng } from '@/engine/shuffle';

export const COLS = 9;
export const ROWS = 10;

export interface Pos {
  c: number;
  r: number;
}
export interface Monster extends Pos {
  kind: number;
  alive: boolean;
}
export interface Pickup extends Pos {
  taken: boolean;
}
export interface Dungeon {
  /** wall[r][c] */
  wall: boolean[][];
  start: Pos;
  exit: Pos;
  monsters: Monster[];
  hearts: Pickup[];
}

export const same = (a: Pos, b: Pos): boolean => a.c === b.c && a.r === b.r;
const DIRS: Pos[] = [
  { c: 1, r: 0 },
  { c: -1, r: 0 },
  { c: 0, r: 1 },
  { c: 0, r: -1 },
];
const inside = (c: number, r: number) => c >= 0 && r >= 0 && c < COLS && r < ROWS;

/** Alle von `from` erreichbaren freien Felder (Entfernung in Schritten) */
export function distances(wall: boolean[][], from: Pos): number[][] {
  const dist = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1));
  dist[from.r][from.c] = 0;
  const q: Pos[] = [from];
  for (let i = 0; i < q.length; i++) {
    const p = q[i];
    for (const d of DIRS) {
      const c = p.c + d.c;
      const r = p.r + d.r;
      if (inside(c, r) && !wall[r][c] && dist[r][c] < 0) {
        dist[r][c] = dist[p.r][p.c] + 1;
        q.push({ c, r });
      }
    }
  }
  return dist;
}

/** Kürzester Weg (ohne Startfeld); leer, wenn es keinen gibt */
export function findPath(wall: boolean[][], from: Pos, to: Pos): Pos[] {
  if (same(from, to) || !inside(to.c, to.r) || wall[to.r][to.c]) return [];
  const dist = distances(wall, to); // rückwärts von Ziel → bei jedem Schritt zum kleineren Wert
  if (dist[from.r][from.c] < 0) return [];
  const path: Pos[] = [];
  let p = from;
  while (!same(p, to)) {
    const n = DIRS.map((d) => ({ c: p.c + d.c, r: p.r + d.r })).find((x) => inside(x.c, x.r) && dist[x.r][x.c] === dist[p.r][p.c] - 1)!;
    path.push(n);
    p = n;
  }
  return path;
}

export function generateDungeon(monsterCount: number, rng: Rng = Math.random): Dungeon {
  const start: Pos = { c: 1, r: ROWS - 2 };
  const exit: Pos = { c: COLS - 2, r: 1 };
  for (let attempt = 0; attempt < 60; attempt++) {
    const wall = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1 || (rng() < 0.24 && Math.abs(c - start.c) + Math.abs(r - start.r) > 1 && Math.abs(c - exit.c) + Math.abs(r - exit.r) > 1)));
    const dist = distances(wall, start);
    if (dist[exit.r][exit.c] < 0) continue;
    // Sackgassen-Inseln, die nicht erreichbar sind, werden zu Wand
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!wall[r][c] && dist[r][c] < 0) wall[r][c] = true;
    const free: Pos[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!wall[r][c] && dist[r][c] >= 3 && !same({ c, r }, exit)) free.push({ c, r });
    if (free.length < monsterCount + 2) continue;
    const spots = shuffle(free, rng);
    const kinds = shuffle([0, 1, 2, 3, 4, 5], rng);
    return {
      wall,
      start,
      exit,
      monsters: spots.slice(0, monsterCount).map((p, i) => ({ ...p, kind: kinds[i % kinds.length], alive: true })),
      hearts: spots.slice(monsterCount, monsterCount + 2).map((p) => ({ ...p, taken: false })),
    };
  }
  // Notlösung: offener Raum
  const wall = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1));
  const free: Pos[] = [];
  for (let r = 1; r < ROWS - 1; r++) for (let c = 1; c < COLS - 1; c++) if (!same({ c, r }, start) && !same({ c, r }, exit) && Math.abs(c - start.c) + Math.abs(r - start.r) > 2) free.push({ c, r });
  const spots = shuffle(free, rng);
  return { wall, start, exit, monsters: spots.slice(0, monsterCount).map((p, i) => ({ ...p, kind: i % 6, alive: true })), hearts: spots.slice(monsterCount, monsterCount + 2).map((p) => ({ ...p, taken: false })) };
}

export const MONSTERS = ['👾', '🐉', '👻', '🦇', '🕷️', '🧟'] as const;
