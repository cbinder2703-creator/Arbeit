import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'vertrags-detektiv',
  title: 'Vertrags-Detektiv',
  tagline: 'Fehler im Vertrag finden',
  icon: 'search',
  color: '#EF4444',
  accepts: ['spot'],
  minItems: 1,
  sessionSize: 1,
  supportsExam: true,
  order: 5,
  Component: lazy(() => import('./Game')),
};
export default mode;
