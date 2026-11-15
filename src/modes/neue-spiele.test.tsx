import { describe, expect, it } from 'vitest';
import { allModes } from './registry';
import { isModeAvailable } from '@/engine/session';
import { getPruefung } from '@/content/loader';

describe('Neue Spiele sind überall dabei, wo Inhalte passen', () => {
  const ids = (pid: string) => allModes.filter((m) => isModeAvailable(m, getPruefung(pid)!)).map((m) => m.id);
  it('registriert', () => {
    for (const id of ['azubionaer', 'boss-kampf', 'wort-jagd', 'blasen-quiz']) expect(allModes.some((m) => m.id === id)).toBe(true);
  });
  it('alle drei Prüfungen bekommen sie – ohne Code-Änderung', () => {
    for (const pid of ['berufsbildung-arbeitswelt', 'englisch-b1', 'lf2-daten-nutzen']) {
      expect(ids(pid)).toEqual(expect.arrayContaining(['azubionaer', 'boss-kampf', 'wort-jagd', 'blasen-quiz']));
    }
  });
  it('LF2 zeigt keine Gerichts-/Vertrags-/Sprach-Modi', () => {
    const lf2 = ids('lf2-daten-nutzen');
    for (const bad of ['kuendigungs-gericht', 'vertrags-detektiv', 'satz-bauen', 'hoeren', 'sprechen']) expect(lf2).not.toContain(bad);
  });
  it('Azubi-Akademie behält Gericht und Detektiv, braucht keine Sprach-Modi', () => {
    const az = ids('berufsbildung-arbeitswelt');
    expect(az).toEqual(expect.arrayContaining(['kuendigungs-gericht', 'vertrags-detektiv']));
    expect(az).not.toContain('hoeren');
  });
});
