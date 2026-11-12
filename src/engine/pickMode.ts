import type { Pruefung } from '@/content/parse';
import type { GameMode } from '@/modes/types';
import { isModeAvailable } from './session';

/** Standard-Modus für „Heute dran“: der erste verfügbare Modus mit Punkten (Quiz-Blitz, falls vorhanden) */
export function pickDefaultMode(modes: GameMode[], p: Pruefung, chapterId?: string): GameMode | undefined {
  const ids = chapterId ? [chapterId] : undefined;
  const ok = modes.filter((m) => m.accepts.length > 0 && !m.noScore && isModeAvailable(m, p, ids));
  return ok.find((m) => m.id === 'quiz-blitz') ?? ok[0];
}

export const playPath = (pruefungId: string, modeId: string, chapterId?: string): string =>
  `/p/${pruefungId}/spiel/${modeId}?kapitel=${chapterId ?? 'alle'}`;
