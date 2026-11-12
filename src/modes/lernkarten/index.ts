import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'lernkarten',
  title: 'Lernkarten',
  tagline: 'Umdrehen, merken, wiederholen',
  icon: 'book-open',
  color: '#EC4899',
  accepts: [],
  usesFlashcards: true,
  noScore: true,
  minItems: 3,
  sessionSize: 15,
  order: 9,
  Component: lazy(() => import('./Game')),
};
export default mode;
