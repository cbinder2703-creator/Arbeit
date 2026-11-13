// Hilfen für Sätze aus Wörtern: Wortliste, Vergleich ohne Groß-/Kleinschreibung und Satzzeichen.
const EDGE = /^[\s.,!?;:"“”„‚‘()]+|[\s.,!?;:"“”„‚‘()]+$/g;

/** Wörter eines Satzes (Satzzeichen am Rand weg, Apostrophe/Bindestriche bleiben) */
export const tokenize = (sentence: string): string[] =>
  sentence
    .replace(/[’‘`´]/g, "'")
    .split(/\s+/)
    .map((w) => w.replace(EDGE, ''))
    .filter(Boolean);

/** Vergleichsform: klein, ohne Satzzeichen, einheitlicher Apostroph, einfache Leerzeichen */
export const normalizeSentence = (s: string): string => tokenize(s).join(' ').toLowerCase();

/** Stimmt der gebaute Satz mit der Lösung oder einer Alternative überein? */
export function matchesAnswer(built: string[] | string, answer: string, alt: string[] = []): boolean {
  const b = normalizeSentence(Array.isArray(built) ? built.join(' ') : built);
  return [answer, ...alt].some((a) => normalizeSentence(a) === b);
}

/** Ähnlichkeit 0–1 zwischen Sollsatz und erkanntem Text (Anteil der Sollwörter in richtiger Reihenfolge, LCS) */
export function similarity(target: string, heard: string): number {
  const a = normalizeSentence(target).split(' ').filter(Boolean);
  const b = normalizeSentence(heard).split(' ').filter(Boolean);
  if (!a.length) return 0;
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length] / a.length;
}
