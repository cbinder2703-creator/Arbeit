import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'memory',
  title: 'Memory',
  tagline: 'Begriff und Erklärung finden',
  icon: 'layers',
  color: '#A855F7',
  accepts: ['pairs'],
  usesFlashcards: true,
  minItems: 3,
  sessionSize: 3,
  flashcardCount: 12,
  order: 6,
  Component: lazy(() => import('./Game')),
};
export default mode;
