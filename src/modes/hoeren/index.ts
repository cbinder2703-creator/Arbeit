import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'hoeren',
  title: 'Hören',
  tagline: 'Satz anhören und den richtigen wählen',
  icon: 'headphones',
  color: '#F472B6',
  accepts: ['listen'],
  minItems: 2,
  sessionSize: 6,
  supportsExam: true,
  order: 12,
  Component: lazy(() => import('./Game')),
};
export default mode;
