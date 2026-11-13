import { describe, expect, it } from 'vitest';
import { getPruefung } from '@/content/loader';
import type { PlayItem } from '@/modes/types';
import { addDays, daysBetween, daysUntil } from './dates';
import { gradeFromPercent } from './grades';
import { INTERVAL_DAYS, nextLeitner } from './leitner';
import { initialScore, partsPoints, scoreAnswer, starsFor } from './scoring';
import { buildSession, isModeAvailable, prepareItem } from './session';
import type { ModeSpec } from './session';
import { mulberry32, shuffle } from './shuffle';
import { chapterStats, dailyTarget, examStatus, heuteDran, solvedPercent } from './stats';
import { levelFromXp, xpForLevel, xpFromPoints } from './xp';
import { emptyProgress } from '@/store/types';

const p = getPruefung('berufsbildung-arbeitswelt')!;
const quiz: ModeSpec = { id: 'quiz-blitz', accepts: ['mc', 'truefalse'], minItems: 10, sessionSize: 10 };

describe('Punkte, XP, Level, Noten', () => {
  it('richtig = 100, Zeitbonus bis +50, Combo ×1,5 ab 3 in Folge', () => {
    let s = initialScore();
    const a = scoreAnswer(s, { itemId: 'a', correct: true, timeMs: 0, timeLimitMs: 20000 });
    expect(a.result.points).toBe(150);
    s = a.next;
    s = scoreAnswer(s, { itemId: 'b', correct: true, timeMs: 20000, timeLimitMs: 20000 }).next;
    const c = scoreAnswer(s, { itemId: 'c', correct: true, timeMs: 20000, timeLimitMs: 20000 });
    expect(c.result.multiplier).toBe(1.5);
    expect(c.result.points).toBe(150);
    const w = scoreAnswer(c.next, { itemId: 'd', correct: false, timeMs: 1000, timeLimitMs: 20000 });
    expect(w.result.points).toBe(0);
    expect(w.next.combo).toBe(0);
  });
  it('mehrteilige Aufgaben: 100 je Teil, −50 je Fehler', () => {
    expect(partsPoints({ correct: 5, errors: 2 })).toBe(400);
    expect(partsPoints({ correct: 0, errors: 3 })).toBe(0);
  });
  it('XP = Punkte / 10; Level n braucht 100·n^1,4', () => {
    expect(xpFromPoints(1234)).toBe(123);
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(264);
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(100 + 264).level).toBe(3);
  });
  it('IHK-Notenschlüssel', () => {
    const t: [number, number][] = [[100, 1], [92, 1], [91, 2], [81, 2], [80, 3], [67, 3], [66, 4], [50, 4], [49, 5], [30, 5], [29, 6], [0, 6]];
    for (const [pct, g] of t) expect(gradeFromPercent(pct)).toBe(g);
  });
  it('Sterne', () => {
    expect(starsFor(10, 10)).toBe(3);
    expect(starsFor(7, 10)).toBe(2);
    expect(starsFor(1, 10)).toBe(1);
    expect(starsFor(0, 10)).toBe(0);
  });
});

describe('Leitner', () => {
  it('richtig → +1 Box, falsch → Box 1; Fälligkeit 0/1/3/7/14 Tage', () => {
    let e = nextLeitner(undefined, true, '2026-01-01');
    expect(e.box).toBe(1); // erste richtige Antwort → Box 1
    expect(INTERVAL_DAYS).toEqual([0, 1, 3, 7, 14]);
    const days: number[] = [];
    for (let i = 0; i < 6; i++) {
      e = nextLeitner(e, true, '2026-01-01');
      days.push(daysBetween('2026-01-01', e.due));
    }
    expect(e.box).toBe(5);
    expect(days.at(-1)).toBe(14);
    const w = nextLeitner(e, false, '2026-01-01');
    expect(w.box).toBe(1);
    expect(w.due).toBe('2026-01-01');
    expect(w.everCorrect).toBe(true);
  });
  it('Datumsrechnung', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(daysUntil('2026-12-03', '2026-11-12')).toBe(21);
    expect(daysUntil(null)).toBeNull();
  });
});

describe('Runde zusammenstellen', () => {
  it('mischt Optionen und rechnet correct um', () => {
    const mc = p.chapters[0].items.find((i) => i.type === 'mc')!;
    if (mc.type !== 'mc') throw new Error();
    const right = mc.options[mc.correct];
    for (let seed = 1; seed < 30; seed++) {
      const x = prepareItem(mc, p.chapters[0], mulberry32(seed)) as Extract<PlayItem, { type: 'mc' }>;
      expect(x.options[x.correct]).toBe(right);
      expect([...x.options].sort()).toEqual([...mc.options].sort());
    }
    const positions = new Set(
      Array.from({ length: 40 }, (_, s) => (prepareItem(mc, p.chapters[0], mulberry32(s)) as { correct: number }).correct),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
  it('order: gemischt, aber nie schon sortiert', () => {
    const o = p.chapters[0].items.find((i) => i.type === 'order')!;
    const x = prepareItem(o, p.chapters[0], mulberry32(3)) as Extract<PlayItem, { type: 'order' }>;
    expect(x.shuffledSteps).toHaveLength(x.steps.length);
    expect(x.shuffledSteps).not.toEqual(x.steps);
  });
  it('cloze: Chips enthalten Lösungen + Ablenker', () => {
    const c = p.chapters[0].items.find((i) => i.type === 'cloze')!;
    const x = prepareItem(c, p.chapters[0], mulberry32(1)) as Extract<PlayItem, { type: 'cloze' }>;
    expect(x.chips).toEqual(expect.arrayContaining(['Berufsschule', 'Kammer']));
  });
  it('bevorzugt fällige Aufgaben, dann neue; Größe wie sessionSize', () => {
    const f = emptyProgress();
    const due = p.chapters[1].items.filter((i) => i.type === 'mc').slice(0, 3).map((i) => i.id);
    due.forEach((id) => (f.leitner[id] = { box: 1, due: '2026-01-01', seen: 1, wrong: 1, everCorrect: false }));
    const s = buildSession(p, quiz, f, { chapterIds: ['k2'] }, '2026-02-01', mulberry32(5));
    expect(s.items).toHaveLength(10);
    expect(s.items.slice(0, 3).map((i) => i.id).sort()).toEqual([...due].sort());
    expect(s.items.every((i) => i.chapter?.id === 'k2')).toBe(true);
  });
  it('itemIds-Filter („Fehler üben“)', () => {
    const ids = p.chapters[0].items.filter((i) => i.type === 'mc').slice(0, 4).map((i) => i.id);
    const s = buildSession(p, quiz, emptyProgress(), { itemIds: ids }, '2026-02-01');
    expect(s.items.map((i) => i.id).sort()).toEqual([...ids].sort());
  });
  it('Modus-Verfügbarkeit hängt vom Inhalt ab', () => {
    expect(isModeAvailable(quiz, p)).toBe(true);
    expect(isModeAvailable({ ...quiz, accepts: ['spot'], minItems: 3 }, p, ['k2'])).toBe(false);
    expect(isModeAvailable({ ...quiz, accepts: ['spot'], minItems: 1 }, p, ['k2'])).toBe(true);
  });
  it('shuffle ist deterministisch mit Seed und verliert nichts', () => {
    const a = shuffle([1, 2, 3, 4, 5], mulberry32(7));
    expect(a).toEqual(shuffle([1, 2, 3, 4, 5], mulberry32(7)));
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('Statistik', () => {
  it('Fortschritt, Heute dran, Freischaltung', () => {
    const f = emptyProgress();
    expect(solvedPercent(p, f)).toBe(0);
    expect(heuteDran(p, f, '2026-02-01')).toMatchObject({ chapterId: 'k1', reason: 'neu' });
    expect(examStatus(p, f).unlocked).toBe(false);
    for (const c of p.chapters) for (const i of c.items) f.leitner[i.id] = { box: 5, due: '2099-01-01', seen: 1, wrong: 0, everCorrect: true };
    expect(solvedPercent(p, f)).toBe(100);
    expect(examStatus(p, f).unlocked).toBe(true);
    expect(chapterStats(p, f, '2026-02-01').every((s) => s.percent === 100)).toBe(true);
    expect(dailyTarget(p, f, '2026-02-01')).toBe(0);
  });
  it('„Heute dran“ nimmt das Kapitel mit den meisten fälligen Aufgaben', () => {
    const f = emptyProgress();
    p.chapters[2].items.slice(0, 5).forEach((i) => (f.leitner[i.id] = { box: 1, due: '2026-01-01', seen: 1, wrong: 1, everCorrect: false }));
    expect(heuteDran(p, f, '2026-02-01')).toMatchObject({ chapterId: 'k3', reason: 'faellig', due: 5 });
  });
});

describe('Sätze aus Wörtern', async () => {
  const { tokenize, normalizeSentence, matchesAnswer, similarity } = await import('./words');
  it('tokenize: Satzzeichen am Rand weg, Apostroph bleibt', () => {
    expect(tokenize('I’ve booked a room, please.')).toEqual(["I've", 'booked', 'a', 'room', 'please']);
    expect(tokenize('Where is the bus-stop?')).toEqual(['Where', 'is', 'the', 'bus-stop']);
  });
  it('Vergleich ohne Groß-/Kleinschreibung und Satzzeichen, mit Alternativen', () => {
    expect(normalizeSentence('  Could I have the bill, please? ')).toBe('could i have the bill please');
    expect(matchesAnswer(['could', 'I', 'have', 'the', 'bill', 'please'], 'Could I have the bill, please?')).toBe(true);
    expect(matchesAnswer('please could I have the bill', 'Could I have the bill, please?', ['Please could I have the bill?'])).toBe(true);
    expect(matchesAnswer('I could have the bill', 'Could I have the bill, please?')).toBe(false);
  });
  it('Ähnlichkeit für Sprechen (Anteil richtiger Wörter in Reihenfolge)', () => {
    expect(similarity('Nice to meet you', 'nice to meet you')).toBe(1);
    expect(similarity('Nice to meet you', 'nice to meat you')).toBe(0.75);
    expect(similarity('Nice to meet you', 'hello')).toBe(0);
    expect(similarity('', 'x')).toBe(0);
  });
});

describe('Lückentext-Chips', () => {
  it('gleiche Wörter in zwei Lücken bekommen zwei Chips', () => {
    const it = { id: 'c', type: 'cloze' as const, difficulty: 1, text: 'I look forward {{to}} it and I am used {{to}} it.', distractors: ['at', 'to'] };
    const x = prepareItem(it, undefined, mulberry32(2)) as { chips: string[] };
    expect(x.chips.filter((c) => c === 'to')).toHaveLength(2);
    expect(x.chips).toContain('at');
  });
});
