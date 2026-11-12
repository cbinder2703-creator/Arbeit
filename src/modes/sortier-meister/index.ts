import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'sortier-meister',
  title: 'Sortier-Meister',
  tagline: 'Karten in die richtigen Fächer',
  icon: 'blocks',
  color: '#3B82F6',
  accepts: ['sort'],
  minItems: 1,
  sessionSize: 1,
  supportsExam: true,
  order: 3,
  Component: lazy(() => import('./Game')),
};
export default mode;
