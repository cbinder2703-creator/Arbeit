import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'elfmeter-3d',
  title: 'Elfmeter 3D',
  tagline: 'Schieß in die Ecke mit der richtigen Antwort – der Torwart hält jede falsche',
  icon: 'trophy',
  color: '#22C55E',
  accepts: ['mc', 'truefalse'],
  minItems: 6,
  sessionSize: 10,
  order: 1.8,
  Component: lazy(() => import('./Game')),
};
export default mode;
