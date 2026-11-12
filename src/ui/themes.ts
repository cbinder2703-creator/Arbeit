// Hintergrundmuster für Prüfungs-Spiele. `theme` in pruefung.json wählt eins aus; unbekannte Namen
// fallen auf „standard“ zurück – eine neue Prüfung braucht also keinen Code.
const svg = (body: string, size = 56) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${body}</svg>`,
  )}")`;

const w = (o: number) => `rgba(255,255,255,${o})`;

export const THEME_PATTERNS: Record<string, string> = {
  // Zahnräder/Schrauben-Raster
  werkstatt: svg(`<circle cx='14' cy='14' r='6' fill='none' stroke='${w(0.14)}' stroke-width='3' stroke-dasharray='3 3'/><circle cx='42' cy='42' r='4' fill='none' stroke='${w(0.12)}' stroke-width='2.5' stroke-dasharray='2 3'/><path d='M40 12h8M44 8v8' stroke='${w(0.12)}' stroke-width='2.5' stroke-linecap='round'/>`),
  // Punkte
  standard: svg(`<circle cx='8' cy='8' r='2' fill='${w(0.14)}'/><circle cx='36' cy='36' r='2' fill='${w(0.14)}'/>`, 44),
  // Diagonale Linien
  arena: svg(`<path d='M-4 44L44 -4M16 60L60 16' stroke='${w(0.12)}' stroke-width='3'/>`, 48),
  // Karomuster (Hefte)
  heft: svg(`<path d='M0 0H40V40' fill='none' stroke='${w(0.12)}' stroke-width='1.5'/>`, 40),
  // Wellen
  welle: svg(`<path d='M0 20q10-12 20 0t20 0' fill='none' stroke='${w(0.14)}' stroke-width='3'/>`, 40),
  // Sterne
  sterne: svg(`<path d='M16 6l2.6 6 6.4.6-4.9 4.3 1.5 6.3L16 19.8 10.4 23.2l1.5-6.3L7 12.6l6.4-.6z' fill='${w(0.13)}'/>`, 44),
};

export const patternFor = (theme: string): string => THEME_PATTERNS[theme] ?? THEME_PATTERNS.standard;
