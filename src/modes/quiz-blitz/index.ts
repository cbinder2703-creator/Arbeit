import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'quiz-blitz',
  title: 'Quiz-Blitz',
  tagline: '10 Fragen gegen die Uhr',
  icon: 'zap',
  color: '#FACC15',
  accepts: ['mc', 'truefalse'],
  minItems: 5,
  sessionSize: 10,
  supportsExam: true,
  order: 1,
  Component: lazy(() => import('./Game')),
};
export default mode;
