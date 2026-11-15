import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'lern-runner',
  title: 'Lern-Runner',
  tagline: 'Renn durch die Spuren – weich Hindernissen aus, lauf durchs richtige Tor',
  icon: 'footprints',
  color: '#F97316',
  accepts: ['mc', 'truefalse'],
  minItems: 6,
  sessionSize: 10,
  order: 1.4,
  Component: lazy(() => import('./Game')),
};
export default mode;
