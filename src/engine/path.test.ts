import { describe, expect, it } from 'vitest';
import type { Pruefung } from '@/content/parse';
import { emptyProgress } from '@/store/types';
import { hasPath, nextLesson, pathLessons, pathProgress } from './path';
import { getPruefung } from '@/content/loader';

const lesson = (id: string) => ({ id, title: id, subtitle: '', icon: 'star', items: ['x'] });
const chapter = (id: string, ids: string[]) => ({ id, chapter: 1, title: id, subtitle: '', pages: '', color: '#123456', icon: 'star', flashcards: [], items: [], lessons: ids.map(lesson) });
const p = { meta: {} as never, chapters: [chapter('k1', ['a', 'b']), chapter('k2', ['c'])] } as unknown as Pruefung;

describe('Lernpfad', () => {
  it('Prüfungen ohne Lektionen haben keinen Pfad', () => {
    expect(hasPath(getPruefung('berufsbildung-arbeitswelt')!)).toBe(false);
    expect(hasPath(p)).toBe(true);
  });
  it('nur die erste Lektion ist offen; geschaffte schalten die nächste frei – auch über Kapitel hinweg', () => {
    const f = emptyProgress();
    expect(pathLessons(p, f).map((l) => l.unlocked)).toEqual([true, false, false]);
    expect(nextLesson(p, f)?.lesson.id).toBe('a');
    f.lessons.a = { stars: 2, best: 80, done: 1 };
    expect(pathLessons(p, f).map((l) => l.unlocked)).toEqual([true, true, false]);
    expect(nextLesson(p, f)?.lesson.id).toBe('b');
    f.lessons.b = { stars: 1, best: 60, done: 1 };
    expect(nextLesson(p, f)?.lesson.id).toBe('c');
    f.lessons.c = { stars: 3, best: 100, done: 1 };
    expect(nextLesson(p, f)).toBeNull();
    expect(pathProgress(p, f)).toEqual({ done: 3, total: 3, percent: 100 });
  });
});
