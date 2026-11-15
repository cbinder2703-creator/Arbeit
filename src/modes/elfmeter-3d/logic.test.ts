import { describe, expect, it } from 'vitest';
import { goalsToWin, keeperZone } from './logic';
import { mulberry32 } from '@/engine/shuffle';

describe('Elfmeter-Logik', () => {
  it('falsche Antwort → Torwart springt in die gewählte Ecke (hält)', () => {
    for (let c = 0; c < 4; c++) expect(keeperZone(4, c, false)).toBe(c);
  });
  it('richtige Antwort → Torwart springt nie in die gewählte Ecke', () => {
    for (let seed = 1; seed < 40; seed++) {
      const rng = mulberry32(seed);
      for (let n = 2; n <= 4; n++) for (let c = 0; c < n; c++) expect(keeperZone(n, c, true, rng)).not.toBe(c);
    }
  });
  it('Sieg ab 60 % Toren', () => {
    expect(goalsToWin(10)).toBe(6);
    expect(goalsToWin(7)).toBe(5);
  });
});
