import type { PlayItem } from '@/modes/types';
import { shuffle } from './shuffle';
import type { Rng } from './shuffle';

export type ChoiceItem = Extract<PlayItem, { type: 'mc' | 'truefalse' }>;

/** Eine Frage mit 2–4 Antworten – für Spiele, in denen Antworten „Orte“ sind (Spuren, Tore, Monster …) */
export interface Challenge {
  item: ChoiceItem;
  question: string;
  choices: string[];
  /** Index der richtigen Antwort in `choices` */
  correct: number;
}

export const isChoiceItem = (i: PlayItem): i is ChoiceItem => i.type === 'mc' || i.type === 'truefalse';

/**
 * Macht aus einer mc-/Wahr-Falsch-Aufgabe eine Frage mit höchstens `max` Antworten.
 * Die richtige bleibt immer dabei, falsche werden zufällig ausgewählt, die Reihenfolge bleibt wie von der Engine gemischt.
 */
export function toChallenge(item: ChoiceItem, max = 4, rng: Rng = Math.random): Challenge {
  if (item.type === 'truefalse') {
    return { item, question: item.statement, choices: ['Wahr', 'Falsch'], correct: item.correct ? 0 : 1 };
  }
  const wrong = item.options.map((_, i) => i).filter((i) => i !== item.correct);
  const keep = new Set([item.correct, ...shuffle(wrong, rng).slice(0, Math.max(1, max - 1))]);
  const order = item.options.map((_, i) => i).filter((i) => keep.has(i));
  return {
    item,
    question: item.question,
    choices: order.map((i) => item.options[i]),
    correct: order.indexOf(item.correct),
  };
}
