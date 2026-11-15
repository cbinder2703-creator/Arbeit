import { describe, expect, it } from 'vitest';
import { CASTLE_HP, LANES, idle, makeDefense, punish, queueWave, stepDefense, upgrade, waveHp, waveSize } from './defense';
import type { Defense } from './defense';
import { mulberry32 } from '@/engine/shuffle';

const SPEED = 24;
const QUESTION_SECONDS = 9;
const QUESTIONS = 10;

/** Spielt eine ganze Partie durch: Antwortzeit je Frage fix, richtig/falsch per Funktion, Turm-Platzierung per Strategie */
function play(seed: number, correct: (i: number) => boolean, build: (d: Defense) => number) {
  const rng = mulberry32(seed);
  const d = makeDefense();
  let tokens = 0;
  const tick = (secs: number) => {
    for (let t = 0; t < secs; t += 0.05) {
      stepDefense(d, 0.05);
      // Bauen, sobald ein Baupunkt da ist
      while (tokens > 0) {
        const l = build(d);
        if (l < 0 || !upgrade(d, l)) break;
        tokens--;
      }
    }
  };
  for (let i = 0; i < QUESTIONS; i++) {
    queueWave(d, i, SPEED, rng);
    tick(QUESTION_SECONDS * 0.7); // lesen
    if (correct(i)) tokens++;
    else punish(d, i, SPEED, rng);
    tick(QUESTION_SECONDS * 0.3);
  }
  for (let t = 0; t < 200 && !idle(d) && d.castle > 0; t += 0.05) stepDefense(d, 0.05);
  return d;
}
/** schlau: baut dort, wo ein Gegner läuft und der Turm am schwächsten ist, sonst schwächste Spur */
const smart = (d: Defense) => {
  const threatened = d.enemies.filter((e) => d.towers[e.lane] < 3).sort((a, b) => d.towers[a.lane] - d.towers[b.lane] || a.x - b.x)[0];
  if (threatened) return threatened.lane;
  const weakest = [...d.towers.keys()].sort((a, b) => d.towers[a] - d.towers[b])[0];
  return d.towers[weakest] < 3 ? weakest : -1;
};

describe('Burg-Wacht: Spiellogik', () => {
  it('Wellen werden größer und zäher', () => {
    expect(waveSize(0)).toBe(2);
    expect(waveSize(9)).toBe(5);
    expect(waveHp(0)).toBeLessThan(waveHp(9));
  });

  it('ein Turm erledigt Gegner in seiner Spur; Gegner ohne Turm treffen die Burg', () => {
    const d = makeDefense();
    d.towers = [0, 1, 0, 0];
    d.queue.push({ wait: 0, lane: 1, hp: 2, speed: 24, kind: 0 }, { wait: 0, lane: 0, hp: 2, speed: 24, kind: 0 });
    for (let t = 0; t < 40; t += 0.05) stepDefense(d, 0.05);
    expect(d.killed).toBe(1);
    expect(d.castle).toBe(CASTLE_HP - 1);
    expect(idle(d)).toBe(true);
  });

  it('Verbessern geht höchstens bis Stufe 3', () => {
    const d = makeDefense();
    expect([upgrade(d, 0), upgrade(d, 0), upgrade(d, 0), upgrade(d, 0)]).toEqual([true, true, true, false]);
    expect(d.towers[0]).toBe(3);
    expect(upgrade(d, LANES)).toBe(false);
  });

  it('wer alles richtig beantwortet und klug baut, gewinnt in 40 Partien (Burg bleibt heil genug)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const d = play(seed, () => true, smart);
      expect(d.castle, `seed ${seed}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('auch mit zwei Fehlern ist es noch machbar', () => {
    let wins = 0;
    for (let seed = 1; seed <= 40; seed++) if (play(seed, (i) => i !== 3 && i !== 6, smart).castle > 0) wins++;
    expect(wins).toBeGreaterThanOrEqual(34);
  });

  it('wer nichts richtig macht, verliert (immer)', () => {
    for (let seed = 1; seed <= 40; seed++) expect(play(seed, () => false, smart).castle, `seed ${seed}`).toBe(0);
  });
});
