import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'raumflug-3d',
  title: 'Raumflug 3D',
  tagline: 'Steuere dein Raumschiff frei durch Asteroiden – flieg durch den Ring mit der richtigen Antwort',
  icon: 'rocket',
  color: '#818CF8',
  accepts: ['mc', 'truefalse'],
  minItems: 6,
  sessionSize: 10,
  order: 1.9,
  Component: lazy(() => import('./Game')),
};
export default mode;
