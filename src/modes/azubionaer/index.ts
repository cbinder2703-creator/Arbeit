import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'azubionaer',
  title: 'Wer wird Azubionär?',
  tagline: '15 Fragen, 3 Joker – bis zur Million',
  icon: 'trophy',
  color: '#EAB308',
  accepts: ['mc'],
  minItems: 15,
  sessionSize: 18, // 15 Fragen + 3 Ersatzfragen für den Joker „Tauschen“
  order: 1.2,
  Component: lazy(() => import('./Game')),
};
export default mode;
