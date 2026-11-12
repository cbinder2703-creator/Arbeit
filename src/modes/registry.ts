// Sammelt alle Spielmodi automatisch: jeder Ordner src/modes/<id>/index.ts mit einem GameMode-Export.
import type { GameMode } from './types';

const found = import.meta.glob('./*/index.ts', { eager: true, import: 'default' }) as Record<string, GameMode>;

export const allModes: GameMode[] = Object.values(found)
  .filter((m): m is GameMode => !!m && typeof m === 'object' && 'id' in m)
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.title.localeCompare(b.title, 'de'));

export const getMode = (id: string | undefined): GameMode | undefined => allModes.find((m) => m.id === id);
