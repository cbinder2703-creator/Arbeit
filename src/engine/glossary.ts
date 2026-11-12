// Begriffe nachschlagen: findet zu einem Aufgabentext passende Lernkarten (Begriff + Erklärung aus content/).
import type { Pruefung } from '@/content/parse';
import type { Flashcard } from '@/content/schema';

export interface GlossaryCard extends Flashcard {
  chapterNumber: number;
  chapterTitle: string;
  chapterColor: string;
}

export const glossaryCards = (p: Pruefung): GlossaryCard[] =>
  p.chapters.flatMap((c) => c.flashcards.map((f) => ({ ...f, chapterNumber: c.chapter, chapterTitle: c.title, chapterColor: c.color })));

const norm = (s: string) => s.toLowerCase().replace(/[„“”"'’.,;:!?()[\]/–—-]/g, ' ').replace(/\s+/g, ' ').trim();
// Wörter, die in vielen Begriffen vorkommen und allein nichts bedeuten
const STOP = new Set(['leistung', 'aufgabe', 'aufgaben', 'ausbildung', 'ausbildungs', 'berufs', 'beruf', 'betrieb', 'neuer', 'folgen', 'gesetz', 'regel']);

/** Schreibweisen eines Begriffs: komplett, ohne Klammer, nur die Klammer (z. B. „BBiG“), einzelne Teile vor / und , */
function variants(term: string): { text: string; strong: boolean }[] {
  const out: { text: string; strong: boolean }[] = [];
  const full = norm(term);
  if (full.length >= 3) out.push({ text: full, strong: true });
  const noParen = norm(term.replace(/\([^)]*\)/g, ''));
  if (noParen.length >= 4 && noParen !== full) out.push({ text: noParen, strong: true });
  for (const part of term.split(/[/,–]/)) {
    const t = norm(part.replace(/\([^)]*\)/g, ''));
    if (t.length >= 6 && t !== full) out.push({ text: t, strong: false });
  }
  return out;
}

/** Kürzel in Klammern, z. B. „BBiG“, „HwO“, „BK“ (mindestens zwei Großbuchstaben) – wird groß/klein genau gesucht */
function abbreviations(term: string): string[] {
  return [...term.matchAll(/\(([A-Za-zÄÖÜäöü]{2,8})\)/g)].map((m) => m[1]).filter((a) => (a.match(/[A-ZÄÖÜ]/g) ?? []).length >= 2);
}

const hasWord = (haystack: string, needle: string) => ` ${haystack} `.includes(` ${needle} `) || (needle.length >= 7 && haystack.includes(needle));

/** Lernkarten, deren Begriff im Text vorkommt (beste Treffer zuerst, höchstens `limit`) */
export function findTerms<T extends Flashcard>(text: string, cards: T[], limit = 6): T[] {
  const hay = norm(text);
  if (!hay) return [];
  const rawWords = new Set(text.split(/[^A-Za-zÄÖÜäöüß+]+/));
  const scored: { c: T; score: number; i: number }[] = [];
  cards.forEach((c, i) => {
    let score = 0;
    for (const v of variants(c.term)) {
      if (hasWord(hay, v.text)) score = Math.max(score, v.strong ? 3 : 2);
    }
    if (abbreviations(c.term).some((a) => rawWords.has(a))) score = Math.max(score, 3);
    if (score === 0) {
      // einzelne längere Wörter des Begriffs (z. B. „Probezeit“ in „Verlängerung der Probezeit“)
      const words = norm(c.term).split(' ').filter((w) => w.length >= 8 && !STOP.has(w));
      if (words.some((w) => hay.includes(w))) score = 1;
    }
    if (score > 0) scored.push({ c, score, i });
  });
  const sorted = scored.sort((a, b) => b.score - a.score || a.i - b.i);
  const strong = sorted.filter((x) => x.score >= 2);
  const weak = sorted.filter((x) => x.score < 2).slice(0, Math.max(0, Math.min(limit, 4) - strong.length));
  return [...strong, ...weak].slice(0, limit).map((x) => x.c);
}

/** Suche im ganzen Glossar (Begriff oder Erklärung enthält den Suchtext) */
export function searchCards<T extends Flashcard>(query: string, cards: T[]): T[] {
  const q = norm(query);
  if (!q) return cards;
  return cards.filter((c) => norm(c.term).includes(q) || norm(c.definition).includes(q));
}
