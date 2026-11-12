import type { Pruefung } from '@/content/parse';
import { gapsOf } from '@/content/parse';
import type { Charts, ChartData, Chapter, ContentItem, Flashcard } from '@/content/schema';
import type { ChapterRef, GameMode, PlayItem } from '@/modes/types';
import { isDue } from './leitner';
import type { PruefungsFortschritt } from '@/store/types';
import { shuffle } from './shuffle';
import type { Rng } from './shuffle';

export type ModeSpec = Pick<
  GameMode,
  'id' | 'accepts' | 'usesFlashcards' | 'usesCharts' | 'minItems' | 'sessionSize' | 'flashcardCount'
>;

export interface SessionFilter {
  /** Kapitel-IDs; leer/undefined = alle Kapitel */
  chapterIds?: string[];
  /** nur diese Aufgaben/Karten (z. B. „Fehler üben“) */
  itemIds?: string[];
  /** Anzahl überschreiben (z. B. Abschlussprüfung) */
  size?: number;
}

export interface Session {
  items: PlayItem[];
  flashcards: Flashcard[];
  charts?: Charts;
}

const chapterRef = (c: Chapter): ChapterRef => ({ id: c.id, number: c.chapter, title: c.title, color: c.color });

export const chartCount = (charts: Charts | undefined): number =>
  charts ? Object.values(charts).filter((c): c is ChartData => typeof c === 'object' && (!!c.points || !!c.values)).length : 0;

function selectChapters(p: Pruefung, filter?: SessionFilter): Chapter[] {
  const ids = filter?.chapterIds;
  return ids && ids.length ? p.chapters.filter((c) => ids.includes(c.id)) : p.chapters;
}

/** Wie viele passende Inhalte hat dieses Kapitel (bzw. alle) für einen Modus? */
export function contentCountFor(mode: ModeSpec, p: Pruefung, chapterIds?: string[]): number {
  const chapters = selectChapters(p, { chapterIds });
  let n = 0;
  for (const c of chapters) {
    n += c.items.filter((i) => mode.accepts.includes(i.type)).length;
    if (mode.usesFlashcards) n += c.flashcards.length;
    if (mode.usesCharts) n += chartCount(c.charts);
  }
  return n;
}

export function isModeAvailable(mode: ModeSpec, p: Pruefung, chapterIds?: string[]): boolean {
  if (Array.isArray(p.meta.modes) && !p.meta.modes.includes(mode.id)) return false;
  return contentCountFor(mode, p, chapterIds) >= mode.minItems;
}

/** Mischt Optionen/Karten/Paare und rechnet `correct` um (Regel 5). */
export function prepareItem(item: ContentItem, chapter: Chapter | undefined, rng: Rng): PlayItem {
  const ref = chapter ? chapterRef(chapter) : undefined;
  switch (item.type) {
    case 'mc':
    case 'case': {
      const order = shuffle(
        item.options.map((_, i) => i),
        rng,
      );
      return {
        ...item,
        options: order.map((i) => item.options[i]),
        correct: order.indexOf(item.correct),
        chapter: ref,
      };
    }
    case 'sort':
      return { ...item, cards: shuffle(item.cards, rng), chapter: ref };
    case 'pairs':
      return { ...item, pairs: shuffle(item.pairs, rng), chapter: ref };
    case 'order': {
      let s = shuffle(item.steps, rng);
      for (let k = 0; k < 8 && s.every((x, i) => x === item.steps[i]); k++) s = shuffle(item.steps, rng);
      return { ...item, shuffledSteps: s, chapter: ref };
    }
    case 'cloze': {
      const chips = shuffle([...new Set([...gapsOf(item.text), ...item.distractors])], rng);
      return { ...item, chips, chapter: ref };
    }
    default:
      return { ...item, chapter: ref };
  }
}

/** fällige zuerst, dann neue, dann der Rest – jeweils gemischt */
function prioritize<T extends { id: string }>(list: T[], progress: PruefungsFortschritt, today: string, rng: Rng): T[] {
  const due: T[] = [];
  const fresh: T[] = [];
  const rest: T[] = [];
  for (const x of list) {
    const e = progress.leitner[x.id];
    if (!e) fresh.push(x);
    else if (isDue(e, today)) due.push(x);
    else rest.push(x);
  }
  return [...shuffle(due, rng), ...shuffle(fresh, rng), ...shuffle(rest, rng)];
}

/** Reine Variante (testbar): stellt eine Runde zusammen. */
export function buildSession(
  p: Pruefung,
  mode: ModeSpec,
  progress: PruefungsFortschritt,
  filter: SessionFilter,
  today: string,
  rng: Rng = Math.random,
): Session {
  const chapters = selectChapters(p, filter);
  const only = filter.itemIds ? new Set(filter.itemIds) : null;
  const chapterOf = new Map<string, Chapter>();
  const pool: ContentItem[] = [];
  for (const c of chapters) {
    for (const it of c.items) {
      chapterOf.set(it.id, c);
      if (mode.accepts.includes(it.type) && (!only || only.has(it.id))) pool.push(it);
    }
  }
  const size = filter.size ?? mode.sessionSize;
  const chosen = prioritize(pool, progress, today, rng).slice(0, size);
  const items = chosen.map((it) => prepareItem(it, chapterOf.get(it.id), rng));

  let flashcards: Flashcard[] = [];
  if (mode.usesFlashcards) {
    const cards = chapters.flatMap((c) => c.flashcards).filter((f) => !only || only.has(f.id));
    const limit = mode.flashcardCount ?? (mode.accepts.length === 0 ? mode.sessionSize : 12);
    flashcards = prioritize(cards, progress, today, rng).slice(0, limit);
  }

  let charts: Charts | undefined;
  if (mode.usesCharts) {
    charts = Object.assign({}, ...chapters.map((c) => c.charts ?? {}));
  }
  return { items, flashcards, charts };
}
