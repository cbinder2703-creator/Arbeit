// Design-Tokens (Vorlage: docs/grafiken/06-designsystem.svg)
export const colors = {
  bg: '#0B1020',
  card: '#151B2E',
  cardHigh: '#1E2640',
  line: '#2A3352',
  text: '#F1F5F9',
  textMute: '#94A3B8',
  k1: '#3B82F6',
  k2: '#F97316',
  k3: '#10B981',
  k4: '#A855F7',
  xp: '#FACC15',
  good: '#22C55E',
  bad: '#EF4444',
} as const;

export const radius = { card: 20, button: 16, sheet: 24 } as const;

/** "#F97316" → "249 115 22" (für Tailwind-Alpha-Werte per CSS-Variable) */
export function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return '249 115 22';
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Dunklere Variante für Verläufe */
export function shade(hex: string, factor: number): string {
  const [r, g, b] = hexToRgbTriplet(hex).split(' ').map(Number);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  return `rgb(${f(r)} ${f(g)} ${f(b)})`;
}
