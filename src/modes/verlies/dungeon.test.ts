import { describe, expect, it } from 'vitest';
import { COLS, ROWS, distances, findPath, generateDungeon, same } from './dungeon';
import { mulberry32 } from '@/engine/shuffle';

describe('Verlies-Karte', () => {
  it('Ausgang, alle Monster und Herzen sind vom Start aus erreichbar (viele Zufallskarten)', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const d = generateDungeon(7, mulberry32(seed));
      const dist = distances(d.wall, d.start);
      expect(dist[d.exit.r][d.exit.c]).toBeGreaterThan(0);
      expect(d.monsters).toHaveLength(7);
      for (const m of d.monsters) {
        expect(d.wall[m.r][m.c]).toBe(false);
        expect(dist[m.r][m.c]).toBeGreaterThanOrEqual(3); // nie direkt am Start
        expect(same(m, d.exit)).toBe(false);
      }
      for (const h of d.hearts) expect(dist[h.r][h.c]).toBeGreaterThan(0);
      const keys = new Set([...d.monsters, ...d.hearts].map((p) => `${p.c},${p.r}`));
      expect(keys.size).toBe(d.monsters.length + d.hearts.length); // nichts übereinander
    }
  });

  it('Rand ist Wand, Karte hat die erwartete Größe', () => {
    const d = generateDungeon(6, mulberry32(5));
    expect(d.wall).toHaveLength(ROWS);
    expect(d.wall[0]).toHaveLength(COLS);
    expect(d.wall[0].every(Boolean) && d.wall[ROWS - 1].every(Boolean)).toBe(true);
  });

  it('findPath liefert einen lückenlosen kürzesten Weg', () => {
    const d = generateDungeon(6, mulberry32(9));
    const p = findPath(d.wall, d.start, d.exit);
    expect(p.length).toBe(distances(d.wall, d.start)[d.exit.r][d.exit.c]);
    let cur = d.start;
    for (const s of p) {
      expect(Math.abs(s.c - cur.c) + Math.abs(s.r - cur.r)).toBe(1);
      expect(d.wall[s.r][s.c]).toBe(false);
      cur = s;
    }
    expect(same(cur, d.exit)).toBe(true);
    expect(findPath(d.wall, d.start, { c: 0, r: 0 })).toEqual([]); // Wand
  });
});
