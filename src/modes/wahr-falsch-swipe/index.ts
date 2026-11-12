import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'wahr-falsch-swipe',
  title: 'Wahr oder Falsch?',
  tagline: 'Rechts wahr, links falsch',
  icon: 'arrow-left-right',
  color: '#22C55E',
  accepts: ['truefalse'],
  minItems: 5,
  sessionSize: 15,
  order: 2,
  Component: lazy(() => import('./Game')),
};
export default mode;
