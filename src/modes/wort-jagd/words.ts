// Aus einer Lernkarte wird ein ratbares Wort: Klammern weg, nur Buchstaben, 4–20 Zeichen.
const ALLOWED = /^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß \-+]*$/;
export const KEYS = 'abcdefghijklmnopqrstuvwxyzäöüß'.split('');

export function guessWord(term: string): string | null {
  const t = term.replace(/\s*\([^)]*\)/g, '').split('/')[0].trim();
  if (!ALLOWED.test(t)) return null;
  const letters = [...t].filter((c) => KEYS.includes(c.toLowerCase())).length;
  return letters >= 4 && letters <= 20 ? t : null;
}

/** Definition ohne den gesuchten Begriff (sonst wäre die Lösung verraten) */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function maskDefinition(definition: string, term: string, word: string): string {
  let out = definition;
  // 1) der ganze Begriff, 2) jedes längere Wort samt Endungen („Duales“ → auch „duale“, „dualen“)
  for (const p of new Set([word, term.replace(/\s*\([^)]*\)/g, '').trim()].filter(Boolean))) out = out.replace(new RegExp(esc(p), 'gi'), '____');
  for (const w of word.split(/[\s\-+]+/).filter((x) => x.length >= 5)) {
    const stem = w.slice(0, Math.max(4, w.length - 2));
    out = out.replace(new RegExp(`${esc(stem)}\\p{L}*`, 'giu'), '____');
  }
  return out;
}

export const isLetter = (c: string): boolean => KEYS.includes(c.toLowerCase());
export const lettersOf = (word: string): string[] => [...word].filter(isLetter).map((c) => c.toLowerCase());
