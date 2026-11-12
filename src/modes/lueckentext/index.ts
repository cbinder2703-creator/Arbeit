import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'lueckentext',
  title: 'Lückentext',
  tagline: 'Wörter in die Lücken setzen',
  icon: 'pencil',
  color: '#06B6D4',
  accepts: ['cloze'],
  minItems: 1,
  sessionSize: 3,
  supportsExam: true,
  order: 7,
  Component: lazy(() => import('./Game')),
};
export default mode;
