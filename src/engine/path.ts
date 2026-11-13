// Lernpfad: Lektionen aller Kapitel in Reihenfolge, Freischaltung und Sterne.
import type { Pruefung } from '@/content/parse';
import type { Chapter, Lesson } from '@/content/schema';
import type { PruefungsFortschritt } from '@/store/types';

export interface PathLesson {
  lesson: Lesson;
  chapter: Chapter;
  /** Position im ganzen Pfad (0-basiert) */
  index: number;
  stars: number;
  /** Erste Lektion oder Vorgänger geschafft */
  unlocked: boolean;
  done: boolean;
}

export const hasPath = (p: Pruefung): boolean => p.chapters.some((c) => c.lessons.length > 0);

export function pathLessons(p: Pruefung, fort: PruefungsFortschritt): PathLesson[] {
  const flat = p.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ lesson, chapter })));
  return flat.map((x, index) => {
    const stars = fort.lessons?.[x.lesson.id]?.stars ?? 0;
    const prev = index === 0 ? 1 : (fort.lessons?.[flat[index - 1].lesson.id]?.stars ?? 0);
    return { ...x, index, stars, unlocked: index === 0 || prev > 0, done: stars > 0 };
  });
}

/** Nächste noch nicht geschaffte, freigeschaltete Lektion (null = alles geschafft) */
export const nextLesson = (p: Pruefung, fort: PruefungsFortschritt): PathLesson | null =>
  pathLessons(p, fort).find((l) => l.unlocked && !l.done) ?? null;

export function pathProgress(p: Pruefung, fort: PruefungsFortschritt): { done: number; total: number; percent: number } {
  const all = pathLessons(p, fort);
  const done = all.filter((l) => l.done).length;
  return { done, total: all.length, percent: all.length ? Math.floor((done / all.length) * 100) : 0 };
}
