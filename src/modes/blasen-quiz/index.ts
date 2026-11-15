import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'blasen-quiz',
  title: 'Blasen-Quiz',
  tagline: 'Tippe die richtige Blase, bevor sie davonfliegt',
  icon: 'target',
  color: '#38BDF8',
  accepts: ['mc', 'truefalse'],
  minItems: 6,
  sessionSize: 10,
  order: 1.3,
  Component: lazy(() => import('./Game')),
};
export default mode;
