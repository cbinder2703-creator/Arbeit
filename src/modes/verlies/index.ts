import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'verlies',
  title: 'Verlies',
  tagline: 'Erkunde das Labyrinth – Monster lassen dich nur nach der richtigen Antwort vorbei',
  icon: 'castle',
  color: '#A855F7',
  accepts: ['mc', 'truefalse'],
  minItems: 8,
  sessionSize: 12,
  order: 1.6,
  Component: lazy(() => import('./Game')),
};
export default mode;
