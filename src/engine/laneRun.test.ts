import { describe, expect, it } from 'vitest';
import { lanesFor, makeRound, moveLane, setLane, stepRound } from './laneRun';
import { mulberry32 } from './shuffle';
import { toChallenge } from './choices';
import type { ChoiceItem } from './choices';

const run = (r: ReturnType<typeof makeRound>, secs: number, dt = 0.05) => {
  const ev = [];
  for (let t = 0; t < secs / dt && r.resolved === null; t++) ev.push(...stepRound(r, dt));
  return ev;
};

describe('Spur-Lauf', () => {
  it('Spuren = Anzahl Antworten (2–4)', () => {
    expect(lanesFor(2)).toBe(2);
    expect(lanesFor(4)).toBe(4);
    expect(lanesFor(7)).toBe(4);
  });

  it('Hindernisse liegen nie zweimal hintereinander in derselben Spur', () => {
    for (let seed = 1; seed < 30; seed++) {
      const r = makeRound(3, { rng: mulberry32(seed) });
      for (let i = 1; i < r.obstacles.length; i++) expect(r.obstacles[i].lane).not.toBe(r.obstacles[i - 1].lane);
    }
  });

  it('wer nie die Spur wechselt, fährt irgendwann in ein Hindernis; das Tor löst mit der aktuellen Spur auf', () => {
    const r = makeRound(3, { rng: mulberry32(3), startLane: 1 });
    const ev = run(r, 20);
    const gate = ev.find((e) => e.type === 'gate');
    expect(gate).toEqual({ type: 'gate', choice: 1 });
    expect(r.resolved).toBe(1);
  });

  it('ein Hindernis zählt nur einmal als Treffer', () => {
    const r = makeRound(2, { rng: mulberry32(1) });
    r.obstacles = [{ d: 5, lane: r.lane, hit: false }];
    const hits = run(r, 3).filter((e) => e.type === 'hit');
    expect(hits).toHaveLength(1);
  });

  it('ausweichen funktioniert: Spur wechseln vor dem Hindernis → kein Treffer', () => {
    const r = makeRound(3, { rng: mulberry32(1), startLane: 1 });
    r.obstacles = [{ d: 10, lane: 1, hit: false }];
    setLane(r, 0);
    expect(run(r, 20).some((e) => e.type === 'hit')).toBe(false);
  });

  it('Spur bleibt im Bereich', () => {
    const r = makeRound(3, { startLane: 0 });
    moveLane(r, -1);
    expect(r.lane).toBe(0);
    moveLane(r, 5);
    expect(r.lane).toBe(2);
  });
});

describe('Frage mit begrenzten Antworten', () => {
  const mc = { id: 'x', type: 'mc', question: 'F?', options: ['a', 'b', 'c', 'd'], correct: 2 } as unknown as ChoiceItem;
  it('behält immer die richtige Antwort und kürzt auf max', () => {
    for (let seed = 1; seed < 20; seed++) {
      const c = toChallenge(mc, 3, mulberry32(seed));
      expect(c.choices).toHaveLength(3);
      expect(c.choices[c.correct]).toBe('c');
    }
  });
  it('Wahr/Falsch → 2 Antworten', () => {
    const tf = { id: 'y', type: 'truefalse', statement: 'S', correct: false } as unknown as ChoiceItem;
    const c = toChallenge(tf);
    expect(c.choices).toEqual(['Wahr', 'Falsch']);
    expect(c.correct).toBe(1);
  });
});
