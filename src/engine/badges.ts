// Abzeichen: Regeln stehen als `condition` in pruefung.json, die Engine wertet sie aus.
import type { Pruefung } from '@/content/parse';
import type { BadgeCondition, BadgeDef } from '@/content/schema';
import type { PruefungsFortschritt } from '@/store/types';
import { getFortschritt, useProgress } from '@/store/progress';
import { levelFromXp } from './xp';

function met(c: BadgeCondition, p: Pruefung, f: PruefungsFortschritt): boolean {
  const items = p.chapters.flatMap((ch) => ch.items);
  const solved = (id: string) => !!f.leitner[id]?.everCorrect;
  switch (c.kind) {
    case 'typeCorrect':
      return items.filter((i) => i.type === c.type && solved(i.id)).length >= c.count;
    case 'allOfType': {
      const of = items.filter((i) => i.type === c.type);
      return of.length > 0 && of.every((i) => solved(i.id));
    }
    case 'item':
      return solved(c.itemId);
    case 'finalGrade':
      return f.bestGrade !== null && f.bestGrade <= c.maxGrade;
    case 'level':
      return levelFromXp(f.xp).level >= c.level;
    case 'streak':
      return f.bestStreak >= c.days;
    case 'lessonsDone':
      return Object.values(f.lessons ?? {}).filter((l) => l.stars > 0).length >= c.count;
  }
}

export const earnedBadgeIds = (p: Pruefung, f: PruefungsFortschritt): string[] =>
  p.meta.badges.filter((b) => met(b.condition, p, f)).map((b) => b.id);

/** Vergibt neu erreichte Abzeichen und liefert sie zurück (für „Neues Abzeichen!“) */
export function awardBadges(p: Pruefung): BadgeDef[] {
  const pid = p.meta.id;
  const f = getFortschritt(pid);
  const fresh = earnedBadgeIds(p, f).filter((id) => !f.badges.includes(id));
  if (!fresh.length) return [];
  useProgress.getState().addBadges(pid, fresh);
  return p.meta.badges.filter((b) => fresh.includes(b.id));
}
