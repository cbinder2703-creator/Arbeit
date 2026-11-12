// Verbindet Spielmodi mit dem gespeicherten Fortschritt (immer unter der pruefungId).
import { dayString } from './dates';
import { getFortschritt, useProgress } from '@/store/progress';
import { levelFromXp, xpFromPoints } from './xp';
import type { AnswerReport } from './scoring';
import type { ModeResult } from '@/modes/types';

export function recordAnswerFor(pid: string, r: Pick<AnswerReport, 'itemId' | 'correct'>): void {
  useProgress.getState().recordAnswer(pid, r.itemId, r.correct, dayString());
}

export interface RoundOutcome {
  xp: number;
  levelBefore: number;
  levelAfter: number;
  xpBefore: number;
  xpAfter: number;
}

/** XP gutschreiben, Bestwerte speichern. `record = false` beim vorzeitigen Beenden (nur XP). */
export function finishRound(pid: string, modeId: string, chapterKey: string, result: ModeResult, record = true): RoundOutcome {
  const st = useProgress.getState();
  const before = getFortschritt(pid).xp;
  const xp = xpFromPoints(result.score);
  st.addXp(pid, xp);
  if (record) {
    st.recordRound(pid, `${modeId}:${chapterKey}`, result.score);
    if (result.stat) st.recordBestTime(pid, `${modeId}:${chapterKey}:${result.stat.key}`, result.stat.value);
  }
  const after = getFortschritt(pid).xp;
  return { xp, xpBefore: before, xpAfter: after, levelBefore: levelFromXp(before).level, levelAfter: levelFromXp(after).level };
}
