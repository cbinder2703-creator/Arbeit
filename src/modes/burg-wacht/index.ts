import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'burg-wacht',
  title: 'Burg-Wacht',
  tagline: 'Verteidige deine Burg – jede richtige Antwort baut oder verstärkt einen Turm',
  icon: 'shield',
  color: '#EAB308',
  accepts: ['mc', 'truefalse'],
  minItems: 6,
  sessionSize: 10,
  order: 1.7,
  Component: lazy(() => import('./Game')),
};
export default mode;
