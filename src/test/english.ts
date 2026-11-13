// Englisch-Testaufgaben (unabhängig von den Azubi-Inhalten) für die Modus-Tests
import { prepareItem } from '@/engine/session';
import { mulberry32 } from '@/engine/shuffle';
import type { ContentItem } from '@/content/schema';
import type { PlayItem } from '@/modes/types';

export const translate1: ContentItem = {
  id: 't-1', type: 'translate', difficulty: 1, prompt: 'Könnte ich bitte die Rechnung haben?',
  answer: 'Could I have the bill, please?', alt: ['Please could I have the bill?'], extra: ['a', 'they'],
};
export const translate2: ContentItem = {
  id: 't-2', type: 'translate', difficulty: 1, prompt: 'Ich habe ein Zimmer gebucht.',
  answer: "I've booked a room.", alt: [], extra: ['was'],
};
export const listen1: ContentItem = {
  id: 'l-1', type: 'listen', difficulty: 1, text: 'The train leaves at half past nine.',
  options: ['The train leaves at half past nine.', 'The train leaves at half past five.', 'The train arrives at half past nine.', 'The plane leaves at half past nine.'],
  correct: 0, translation: 'Der Zug fährt um halb zehn ab.',
};
export const speak1: ContentItem = { id: 's-1', type: 'speak', difficulty: 1, text: 'Nice to meet you.', translation: 'Schön, dich kennenzulernen.' };
export const speak2: ContentItem = { id: 's-2', type: 'speak', difficulty: 1, text: 'Where is the station?', translation: 'Wo ist der Bahnhof?' };

export const play = (item: ContentItem, seed = 1): PlayItem => prepareItem(item, undefined, mulberry32(seed));
