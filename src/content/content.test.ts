import { describe, expect, it } from 'vitest';
import { allePruefungen, getPruefung, loadFromModules } from './loader';
import { parsePruefung } from './parse';

const meta = {
  id: 'x', title: 'T', gameTitle: 'G', examDate: null, color: '#112233', accent: '#445566',
  chapters: ['k1.json'], finalExam: { questions: 1, unlockAtPercent: 50 },
};
const chapter = (items: unknown[]) => ({ id: 'k1', chapter: 1, title: 'K', color: '#112233', items, flashcards: [] });
const mc = { id: 'a', type: 'mc', difficulty: 1, question: 'Q', options: ['1', '2'], correct: 0 };

describe('Inhalte laden', () => {
  it('findet die Azubi-Akademie mit allen Aufgaben und Lernkarten', () => {
    const p = getPruefung('berufsbildung-arbeitswelt');
    expect(p).toBeDefined();
    expect(p!.meta.gameTitle).toBe('Azubi-Akademie');
    expect(p!.chapters).toHaveLength(4);
    expect(p!.chapters.reduce((n, c) => n + c.items.length, 0)).toBe(164);
    expect(p!.chapters.reduce((n, c) => n + c.flashcards.length, 0)).toBe(71);
  });

  it('jede Prüfung ist unabhängig: IDs sind nur innerhalb einer Prüfung eindeutig', () => {
    expect(new Set(allePruefungen.map((p) => p.meta.id)).size).toBe(allePruefungen.length);
  });

  it('eine neue Prüfungs-Ordner erscheint ohne Code-Änderung', () => {
    const base = (f: string) => `/content/pruefungen/neu/${f}`;
    const res = loadFromModules({
      [base('pruefung.json')]: { ...meta, id: 'neu' },
      [base('k1.json')]: chapter([mc]),
    });
    expect(res.errors).toEqual([]);
    expect(res.pruefungen.map((p) => p.meta.id)).toEqual(['neu']);
  });
});

describe('Schema + Prüfregeln', () => {
  const run = (items: unknown[], m: object = meta) => parsePruefung('x', m, { 'k1.json': chapter(items) });

  it('akzeptiert gültige Inhalte', () => {
    expect(run([mc]).errors).toEqual([]);
  });
  it('lehnt falschen correct-Index ab', () => {
    expect(run([{ ...mc, correct: 5 }]).errors.join()).toMatch(/correct=5/);
  });
  it('lehnt doppelte IDs ab', () => {
    expect(run([mc, mc]).errors.join()).toMatch(/doppelt/);
  });
  it('lehnt falsche Ordner-ID ab', () => {
    expect(parsePruefung('anders', meta, { 'k1.json': chapter([mc]) }).errors.join()).toMatch(/Ordnernamen/);
  });
  it('meldet fehlende Kapteldatei', () => {
    expect(parsePruefung('x', meta, {}).errors.join()).toMatch(/fehlt/);
  });
  it('prüft sort-Kategorien und cloze-Lücken', () => {
    const sort = { id: 's', type: 'sort', difficulty: 1, question: 'Q', categories: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], cards: [{ text: 'x', category: 'a' }, { text: 'y', category: 'zzz' }] };
    expect(run([sort]).errors.join()).toMatch(/unbekannte Kategorie/);
    const cloze = { id: 'c', type: 'cloze', difficulty: 1, text: 'ohne Lücke', distractors: [] };
    expect(run([cloze]).errors.join()).toMatch(/Lücke/);
  });
  it('prüft Abzeichen-Verweise', () => {
    const m = { ...meta, badges: [{ id: 'b', title: 'B', rule: 'r', condition: { kind: 'item', itemId: 'gibt-es-nicht' } }] };
    expect(run([mc], m).errors.join()).toMatch(/unbekannte Aufgabe/);
  });
});
