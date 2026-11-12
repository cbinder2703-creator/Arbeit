import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'zeitstrahl',
  title: 'Zeitstrahl',
  tagline: 'Schritte richtig ordnen',
  icon: 'route',
  color: '#14B8A6',
  accepts: ['order'],
  minItems: 1,
  sessionSize: 3,
  supportsExam: true,
  order: 8,
  Component: lazy(() => import('./Game')),
};
export default mode;
