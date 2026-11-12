/** IHK-Schlüssel: 100–92 % = 1 · 91–81 = 2 · 80–67 = 3 · 66–50 = 4 · 49–30 = 5 · 29–0 = 6 */
export function gradeFromPercent(percent: number): number {
  const p = Math.round(percent);
  if (p >= 92) return 1;
  if (p >= 81) return 2;
  if (p >= 67) return 3;
  if (p >= 50) return 4;
  if (p >= 30) return 5;
  return 6;
}

export const GRADE_LABEL: Record<number, string> = {
  1: 'sehr gut',
  2: 'gut',
  3: 'befriedigend',
  4: 'ausreichend',
  5: 'mangelhaft',
  6: 'ungenügend',
};
