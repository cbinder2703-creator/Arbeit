import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'hoeher-tiefer',
  title: 'Höher oder tiefer?',
  tagline: 'Kurven und Zahlen schätzen',
  icon: 'trending-up',
  color: '#84CC16',
  accepts: [],
  usesCharts: true,
  minItems: 1,
  sessionSize: 10,
  order: 10,
  Component: lazy(() => import('./Game')),
};
export default mode;
