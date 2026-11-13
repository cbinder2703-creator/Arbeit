import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'satz-bauen',
  title: 'Satz bauen',
  tagline: 'Übersetzen: Wörter in die richtige Reihenfolge tippen',
  icon: 'puzzle',
  color: '#0EA5E9',
  accepts: ['translate'],
  minItems: 2,
  sessionSize: 8,
  supportsExam: true,
  order: 11,
  Component: lazy(() => import('./Game')),
};
export default mode;
