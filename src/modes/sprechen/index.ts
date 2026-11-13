import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'sprechen',
  title: 'Sprechen',
  tagline: 'Sätze laut nachsprechen',
  icon: 'mic',
  color: '#22D3EE',
  accepts: ['speak'],
  minItems: 2,
  sessionSize: 5,
  order: 13,
  Component: lazy(() => import('./Game')),
};
export default mode;
