import { describe, expect, it } from 'vitest';
import { emailToUsername, normalizeUsername, passwordError, usernameError, usernameToEmail } from './username';
import { mergeFortschritt, mergeProgress, parsePayload } from './merge';
import { emptyProgress } from '@/store/types';
import type { PruefungsFortschritt } from '@/store/types';

describe('Nutzername', () => {
  it('„Max“, „max“ und „ MAX “ sind derselbe Name (Eindeutigkeit)', () => {
    expect(usernameToEmail('Max')).toBe(usernameToEmail(' max '));
    expect(usernameToEmail('MAX')).toBe('max@nutzer.lerndruck.de');
    expect(normalizeUsername('  Anna_K ')).toBe('anna_k');
    expect(emailToUsername('anna_k@nutzer.lerndruck.de')).toBe('anna_k');
  });
  it('nur sichere Zeichen, 3–20 Länge', () => {
    expect(usernameError('Max')).toBeNull();
    expect(usernameError('ab')).toMatch(/mindestens 3/);
    expect(usernameError('a'.repeat(21))).toMatch(/höchstens 20/);
    for (const bad of ['mäx', 'max muster', 'max@x', 'max/../x', 'maх' /* kyrillisches х */, '😀😀😀']) expect(usernameError(bad)).toMatch(/Erlaubt sind nur/);
    expect(usernameError('.max')).toMatch(/nicht mit einem Sonderzeichen/);
    expect(usernameError('max-')).toMatch(/nicht mit einem Sonderzeichen/);
  });
  it('Passwort: mindestens 8 Zeichen', () => {
    expect(passwordError('1234567')).toMatch(/mindestens 8/);
    expect(passwordError('12345678')).toBeNull();
    expect(passwordError('x'.repeat(73))).toMatch(/höchstens 72/);
  });
});

const pf = (o: Partial<PruefungsFortschritt>): PruefungsFortschritt => ({ ...emptyProgress(), ...o });
const entry = (box: number, seen: number, due = '2026-01-10', everCorrect = true) => ({ box, due, seen, wrong: 0, everCorrect });

describe('Fortschritt zusammenführen', () => {
  it('nimmt je Wert den besseren Stand und verliert nichts', () => {
    const a = pf({ xp: 100, rounds: 3, badges: ['x'], bestGrade: 3, bestPercent: 70, bestScores: { 'q:alle': 500 }, bestTimes: { 'm:alle:zeit': 90 }, leitner: { i1: entry(2, 1), i2: entry(1, 1) }, lastDay: '2026-01-05', streak: 2, bestStreak: 4, lessons: { l1: { stars: 1, best: 60, done: 1 } }, daily: { '2026-01-05': { answered: 5, correct: 3 } } });
    const b = pf({ xp: 150, rounds: 2, badges: ['y'], bestGrade: 2, bestPercent: 85, bestScores: { 'q:alle': 400, 'w:alle': 100 }, bestTimes: { 'm:alle:zeit': 60 }, leitner: { i1: entry(4, 3), i3: entry(1, 1) }, lastDay: '2026-01-07', streak: 1, bestStreak: 3, lessons: { l1: { stars: 3, best: 100, done: 2 }, l2: { stars: 1, best: 50, done: 1 } }, daily: { '2026-01-05': { answered: 2, correct: 2 }, '2026-01-07': { answered: 1, correct: 1 } } });
    const m = mergeFortschritt(a, b);
    expect(m.xp).toBe(150);
    expect(m.rounds).toBe(3);
    expect([...m.badges].sort()).toEqual(['x', 'y']);
    expect(m.bestGrade).toBe(2);
    expect(m.bestPercent).toBe(85);
    expect(m.bestScores).toEqual({ 'q:alle': 500, 'w:alle': 100 });
    expect(m.bestTimes['m:alle:zeit']).toBe(60);
    expect(Object.keys(m.leitner).sort()).toEqual(['i1', 'i2', 'i3']);
    expect(m.leitner.i1.box).toBe(4); // öfter gesehen = neuerer Wissensstand
    expect(m.lastDay).toBe('2026-01-07');
    expect(m.streak).toBe(1); // Streak des Geräts mit dem neueren Tag
    expect(m.bestStreak).toBe(4);
    expect(m.lessons.l1).toEqual({ stars: 3, best: 100, done: 2 });
    expect(m.lessons.l2.stars).toBe(1);
    expect(m.daily['2026-01-05']).toEqual({ answered: 5, correct: 3 });
  });
  it('Zurücksetzen gewinnt gegen älteren Stand eines anderen Geräts', () => {
    const old = pf({ xp: 999, badges: ['x'] });
    const reset = pf({ xp: 0, resetAt: 1000 });
    expect(mergeFortschritt(old, reset).xp).toBe(0);
    expect(mergeFortschritt(reset, old).xp).toBe(0);
  });
  it('ganzer Stand: Prüfungen werden vereinigt, leere Cloud ändert nichts', () => {
    const local = { byPruefung: { a: pf({ xp: 5 }) }, globalStreak: 2, bestGlobalStreak: 2, globalLastDay: '2026-01-05' };
    expect(mergeProgress(local, null)).toEqual(local);
    const remote = { byPruefung: { b: pf({ xp: 7 }) }, globalStreak: 1, bestGlobalStreak: 5, globalLastDay: '2026-01-06' };
    const m = mergeProgress(local, remote);
    expect(Object.keys(m.byPruefung).sort()).toEqual(['a', 'b']);
    expect(m.bestGlobalStreak).toBe(5);
    expect(m.globalLastDay).toBe('2026-01-06');
  });
  it('kaputte Cloud-Daten werden ignoriert', () => {
    expect(parsePayload(null)).toBeNull();
    expect(parsePayload({})).toBeNull();
    expect(parsePayload({ v: 2, byPruefung: {} })).toBeNull();
    expect(parsePayload({ v: 1, byPruefung: {} })).toMatchObject({ byPruefung: {}, globalStreak: 0 });
  });
});
