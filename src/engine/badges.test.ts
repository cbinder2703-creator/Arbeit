import { describe, expect, it } from 'vitest';
import { getPruefung } from '@/content/loader';
import { emptyProgress } from '@/store/types';
import { earnedBadgeIds } from './badges';

const p = getPruefung('berufsbildung-arbeitswelt')!;
const solve = (f: ReturnType<typeof emptyProgress>, ids: string[]) =>
  ids.forEach((id) => (f.leitner[id] = { box: 2, due: '2099-01-01', seen: 1, wrong: 0, everCorrect: true }));

describe('Abzeichen aus pruefung.json', () => {
  const all = p.chapters.flatMap((c) => c.items);
  it('zu Beginn keines', () => expect(earnedBadgeIds(p, emptyProgress())).toEqual([]));
  it('Paragrafen-Profi: 10 case-Aufgaben richtig', () => {
    const f = emptyProgress();
    const cases = all.filter((i) => i.type === 'case').map((i) => i.id);
    solve(f, cases.slice(0, 9));
    expect(earnedBadgeIds(p, f)).not.toContain('paragrafen-profi');
    solve(f, cases.slice(0, 10));
    expect(earnedBadgeIds(p, f)).toContain('paragrafen-profi');
  });
  it('Vertrags-Checker: beide spot-Aufgaben', () => {
    const f = emptyProgress();
    const spots = all.filter((i) => i.type === 'spot').map((i) => i.id);
    solve(f, [spots[0]]);
    expect(earnedBadgeIds(p, f)).not.toContain('vertrags-checker');
    solve(f, spots);
    expect(earnedBadgeIds(p, f)).toContain('vertrags-checker');
  });
  it('Pflicht-Kenner: Item k2-201', () => {
    const f = emptyProgress();
    solve(f, ['k2-201']);
    expect(earnedBadgeIds(p, f)).toEqual(['pflicht-kenner']);
  });
  it('Bestanden (Note ≤ 4) und Einser-Kandidat (Note 1)', () => {
    const f = emptyProgress();
    f.bestGrade = 4;
    expect(earnedBadgeIds(p, f)).toEqual(['pruefung-bestanden']);
    f.bestGrade = 1;
    expect(earnedBadgeIds(p, f).sort()).toEqual(['einser-kandidat', 'pruefung-bestanden']);
    f.bestGrade = 5;
    expect(earnedBadgeIds(p, f)).toEqual([]);
  });
});
