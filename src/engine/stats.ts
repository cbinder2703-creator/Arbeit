import type { Pruefung } from '@/content/parse';
import type { PruefungsFortschritt } from '@/store/types';
import { addDays, daysUntil } from './dates';
import { isDue } from './leitner';
import { levelFromXp } from './xp';

export interface ChapterStat {
  chapterId: string;
  total: number;
  solved: number;
  percent: number;
  due: number;
}

export function chapterStats(p: Pruefung, fort: PruefungsFortschritt, today: string): ChapterStat[] {
  return p.chapters.map((c) => {
    const ids = [...c.items.map((i) => i.id), ...c.flashcards.map((f) => f.id)];
    const itemIds = c.items.map((i) => i.id);
    const solved = itemIds.filter((id) => fort.leitner[id]?.everCorrect).length;
    return {
      chapterId: c.id,
      total: itemIds.length,
      solved,
      percent: itemIds.length ? Math.round((solved / itemIds.length) * 100) : 0,
      due: ids.filter((id) => isDue(fort.leitner[id], today)).length,
    };
  });
}

export const totalItems = (p: Pruefung): number => p.chapters.reduce((n, c) => n + c.items.length, 0);

export function solvedPercent(p: Pruefung, fort: PruefungsFortschritt): number {
  const total = totalItems(p);
  if (!total) return 0;
  const solved = p.chapters.flatMap((c) => c.items).filter((i) => fort.leitner[i.id]?.everCorrect).length;
  return Math.round((solved / total) * 100);
}

export interface HeuteDran {
  chapterId: string;
  reason: 'faellig' | 'neu' | 'wiederholen';
  due: number;
}

/** Kapitel mit den meisten fälligen Leitner-Items; sonst das erste Kapitel mit offenen Aufgaben */
export function heuteDran(p: Pruefung, fort: PruefungsFortschritt, today: string): HeuteDran {
  const stats = chapterStats(p, fort, today);
  const byDue = [...stats].sort((a, b) => b.due - a.due)[0];
  if (byDue && byDue.due > 0) return { chapterId: byDue.chapterId, reason: 'faellig', due: byDue.due };
  const open = stats.find((s) => s.solved < s.total);
  if (open) return { chapterId: open.chapterId, reason: 'neu', due: 0 };
  const weakest = [...stats].sort((a, b) => a.percent - b.percent)[0];
  return { chapterId: (weakest ?? stats[0]).chapterId, reason: 'wiederholen', due: 0 };
}

export const dueTotal = (p: Pruefung, fort: PruefungsFortschritt, today: string): number =>
  chapterStats(p, fort, today).reduce((n, s) => n + s.due, 0);

/** „Noch X Tage – heute Y Aufgaben üben“ */
export function dailyTarget(p: Pruefung, fort: PruefungsFortschritt, today: string): number {
  const total = totalItems(p);
  const open = total - p.chapters.flatMap((c) => c.items).filter((i) => fort.leitner[i.id]?.everCorrect).length;
  const days = daysUntil(p.meta.examDate, today);
  const due = dueTotal(p, fort, today);
  const plan = days !== null && days > 0 ? Math.ceil(open / days) : open > 0 ? 10 : 0;
  return Math.min(40, Math.max(due, plan, open > 0 || due > 0 ? 5 : 0));
}

/** Richtig-Quote der letzten 7 Tage (null = nichts gespielt) */
export function recentAccuracy(fort: PruefungsFortschritt, today: string): { percent: number; answered: number } | null {
  let answered = 0;
  let correct = 0;
  for (let i = 0; i < 7; i++) {
    const d = fort.daily[addDays(today, -i)];
    if (d) {
      answered += d.answered;
      correct += d.correct;
    }
  }
  return answered ? { percent: Math.round((correct / answered) * 100), answered } : null;
}

export const levelOf = (fort: PruefungsFortschritt) => levelFromXp(fort.xp);

/** Abschlussprüfung freigeschaltet? (≥ unlockAtPercent % der Aufgaben einmal richtig) */
export function examStatus(p: Pruefung, fort: PruefungsFortschritt) {
  const percent = solvedPercent(p, fort);
  const need = p.meta.finalExam.unlockAtPercent;
  return { percent, need, unlocked: percent >= need };
}

export function countdownText(examDate: string | null, today: string): string | null {
  const d = daysUntil(examDate, today);
  if (d === null) return null;
  if (d < 0) return 'Prüfung vorbei';
  if (d === 0) return 'Prüfung heute!';
  if (d === 1) return 'Prüfung morgen';
  return `Prüfung in ${d} Tagen`;
}
