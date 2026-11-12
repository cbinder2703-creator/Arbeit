// Tage als lokale Strings "JJJJ-MM-TT" – einfach zu speichern und zu vergleichen.
const pad = (n: number) => String(n).padStart(2, '0');

export function dayString(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // Mittag: unempfindlich gegen Zeitumstellung
}

export function addDays(s: string, n: number): string {
  const d = parseDay(s);
  d.setDate(d.getDate() + n);
  return dayString(d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86_400_000);
}

/** Tage bis zum Prüfungstermin (0 = heute, negativ = vorbei, null = kein Termin) */
export function daysUntil(examDate: string | null, today: string = dayString()): number | null {
  if (!examDate) return null;
  return daysBetween(today, examDate);
}

export function formatDate(s: string): string {
  return parseDay(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
