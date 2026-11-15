import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'turm-3d',
  title: 'Turmbau 3D',
  tagline: 'Jede richtige Antwort setzt einen Block auf – bei einer falschen wackelt der Turm',
  icon: 'layers',
  color: '#F472B6',
  accepts: ['mc', 'truefalse'],
  minItems: 6,
  sessionSize: 10,
  order: 1.95,
  Component: lazy(() => import('./Game')),
};
export default mode;
