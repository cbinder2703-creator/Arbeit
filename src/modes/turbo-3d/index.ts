import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'turbo-3d',
  title: 'Turbo-Rennen 3D',
  tagline: 'Fahr in 3D durch die Spuren – fahr unter dem Schild mit der richtigen Antwort durch',
  icon: 'rocket',
  color: '#22D3EE',
  accepts: ['mc', 'truefalse'],
  minItems: 6,
  sessionSize: 10,
  order: 1.5,
  Component: lazy(() => import('./Game')),
};
export default mode;
