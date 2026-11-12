# Einen neuen Spielmodus hinzufügen

Spielmodi (Quiz-Blitz, Memory …) stehen automatisch in **allen** Prüfungs-Spielen zur Verfügung,
sofern die Prüfung passende Inhalte hat. Eine neue **Prüfung** anlegen → `NEUE-PRUEFUNG.md`.

1. Ordner anlegen: `src/modes/<modus-id>/` (kebab-case, z. B. `azubionaer`).
2. `index.ts` exportiert einen `GameMode` (Schnittstelle in `CLAUDE.md`):

```ts
import { lazy } from 'react';
import type { GameMode } from '../types';

const mode: GameMode = {
  id: 'azubionaer',
  title: 'Wer wird Azubionär?',
  tagline: '15 Fragen, 3 Joker, steigende Schwierigkeit',
  icon: 'trophy',
  color: '#EAB308',
  accepts: ['mc'],
  minItems: 15,
  sessionSize: 15,
  Component: lazy(() => import('./Game')),
};
export default mode;
```

3. `Game.tsx` bekommt `ModeProps` (Items sind schon gefiltert und gemischt).
   Nach jeder Antwort `onAnswer(...)` aufrufen, am Ende `onFinish(...)`.
4. Kein Speichern, keine XP im Spiel selbst – das macht die Engine.
5. Test anlegen: `src/modes/<modus-id>/Game.test.tsx` (rendert, beantwortet eine Frage richtig und eine falsch).
6. Regel in `docs/SPIELMODI.md` ergänzen.

Fertig – die Registry findet den Modus automatisch, er erscheint in jedem Prüfungs-Spiel.

Neue Lerninhalte oder Prüfungen → `NEUE-PRUEFUNG.md`.
