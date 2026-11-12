// Test-Hilfen für Spielmodi: echte Inhalte, echte Punkte-Logik, aufgezeichnete Aufrufe.
import { vi } from 'vitest';
import { getPruefung } from '@/content/loader';
import type { ContentItem, ItemType } from '@/content/schema';
import { initialScore, scoreAnswer } from '@/engine/scoring';
import type { AnswerReport } from '@/engine/scoring';
import { prepareItem } from '@/engine/session';
import { mulberry32 } from '@/engine/shuffle';
import type { ModeProps, PlayItem } from '@/modes/types';

export const pruefung = getPruefung('berufsbildung-arbeitswelt')!;

export function pick(type: ItemType, n = 1, chapter = 0, offset = 0): PlayItem[] {
  const c = pruefung.chapters[chapter];
  return c.items
    .filter((i): i is ContentItem => i.type === type)
    .slice(offset, offset + n)
    .map((i, k) => prepareItem(i, c, mulberry32(100 + k)));
}

export function makeProps(items: PlayItem[], extra: Partial<ModeProps> = {}) {
  let state = initialScore();
  const reports: AnswerReport[] = [];
  const onAnswer = vi.fn((r: AnswerReport) => {
    reports.push(r);
    const { result, next } = scoreAnswer(state, r);
    state = next;
    return result;
  });
  const onFinish = vi.fn();
  const onClose = vi.fn();
  const props: ModeProps = {
    pruefung: pruefung.meta,
    items,
    flashcards: [],
    score: 0,
    onAnswer,
    onFinish,
    onClose,
    ...extra,
  };
  return { props, reports, onAnswer, onFinish, onClose };
}
