// Abschlussprüfung: Aufgaben je Kapitel anteilig ziehen, Teilpunkte, Note nach IHK-Schlüssel.
import type { Pruefung } from '@/content/parse';
import type { Chapter, ContentItem } from '@/content/schema';
import type { AnswerReport } from './scoring';
import { gradeFromPercent } from './grades';
import { shuffle } from './shuffle';
import type { Rng } from './shuffle';

export interface ExamPick {
  item: ContentItem;
  chapter: Chapter;
}

/** Anteil richtig 0–1: mehrteilige Aufgaben zählen je Teil (Fehler ziehen ab), sonst richtig/falsch */
export function fractionOf(r: Pick<AnswerReport, 'correct' | 'parts'>): number {
  if (r.parts) return Math.max(0, Math.min(1, (r.parts.correct - r.parts.errors) / Math.max(1, r.parts.total)));
  return r.correct ? 1 : 0;
}

/** `n` Aufgaben aus allen Kapiteln – verteilt nach Größe der Kapitel, danach gemischt */
export function pickExamItems(p: Pruefung, n: number, rng: Rng = Math.random): ExamPick[] {
  const total = p.chapters.reduce((s, c) => s + c.items.length, 0);
  const want = Math.min(n, total);
  const quota = p.chapters.map((c) => ({ c, q: Math.floor((want * c.items.length) / total), rest: (want * c.items.length) / total - Math.floor((want * c.items.length) / total) }));
  let missing = want - quota.reduce((s, x) => s + x.q, 0);
  for (const x of [...quota].sort((a, b) => b.rest - a.rest)) {
    if (missing <= 0) break;
    if (x.q < x.c.items.length) {
      x.q++;
      missing--;
    }
  }
  const picks = quota.flatMap(({ c, q }) => shuffle(c.items, rng).slice(0, q).map((item) => ({ item, chapter: c })));
  return shuffle(picks, rng);
}

export interface ExamScore {
  percent: number;
  grade: number;
  passed: boolean;
  points: number;
  byChapter: { chapterId: string; title: string; color: string; number: number; percent: number; count: number }[];
  wrongIds: string[];
}

export function scoreExam(picks: ExamPick[], fractions: Record<string, number>): ExamScore {
  const sum = picks.reduce((s, x) => s + (fractions[x.item.id] ?? 0), 0);
  const percent = picks.length ? Math.round((sum / picks.length) * 100) : 0;
  const grade = gradeFromPercent(percent);
  const chapters = new Map<string, ExamScore['byChapter'][number] & { sum: number }>();
  for (const { item, chapter } of picks) {
    const e = chapters.get(chapter.id) ?? { chapterId: chapter.id, title: chapter.title, color: chapter.color, number: chapter.chapter, percent: 0, count: 0, sum: 0 };
    e.count++;
    e.sum += fractions[item.id] ?? 0;
    chapters.set(chapter.id, e);
  }
  return {
    percent,
    grade,
    passed: grade <= 4,
    points: Math.round(sum * 100),
    byChapter: [...chapters.values()].sort((a, b) => a.number - b.number).map(({ sum: s, ...e }) => ({ ...e, percent: Math.round((s / e.count) * 100) })),
    wrongIds: picks.filter((x) => (fractions[x.item.id] ?? 0) < 1).map((x) => x.item.id),
  };
}
