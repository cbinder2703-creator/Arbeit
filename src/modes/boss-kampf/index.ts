import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'boss-kampf',
  title: 'Boss-Kampf',
  tagline: 'Richtig = Treffer, falsch = der Boss schlägt zu',
  icon: 'swords',
  color: '#EF4444',
  accepts: ['mc', 'truefalse'],
  minItems: 8,
  sessionSize: 12,
  order: 1.1,
  Component: lazy(() => import('./Game')),
};
export default mode;
