import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'kuendigungs-gericht',
  title: 'Kündigungs-Gericht',
  tagline: 'Fälle beurteilen wie ein Richter',
  icon: 'gavel',
  color: '#F97316',
  accepts: ['case'],
  minItems: 1,
  sessionSize: 5,
  order: 4,
  Component: lazy(() => import('./Game')),
};
export default mode;
