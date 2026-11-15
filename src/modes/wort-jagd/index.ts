import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'wort-jagd',
  title: 'Begriffe-Raten',
  tagline: 'Fachbegriff Buchstabe für Buchstabe erraten',
  icon: 'spell-check',
  color: '#22D3EE',
  accepts: [],
  usesFlashcards: true,
  minItems: 6,
  sessionSize: 6,
  flashcardCount: 30, // Auswahl, aus der die ratbaren Begriffe gezogen werden
  order: 6.5,
  Component: lazy(() => import('./Game')),
};
export default mode;
