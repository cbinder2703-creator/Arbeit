// Auswertung von Lückentexten. Lücken, die nur durch „und“, „oder“, Komma, „sowie“, „&“ oder „/“ verbunden sind
// („… teilen sich {{Berufsschule}} und {{Ausbildungsbetrieb}} …“), dürfen in beliebiger Reihenfolge stehen.

export type Seg = { kind: 'text'; text: string } | { kind: 'gap'; answer: string; n: number };

export function parse(text: string): Seg[] {
  const out: Seg[] = [];
  let n = 0;
  for (const part of text.split(/(\{\{.+?\}\})/g)) {
    const m = part.match(/^\{\{(.+?)\}\}$/);
    if (m) out.push({ kind: 'gap', answer: m[1], n: n++ });
    else if (part) out.push({ kind: 'text', text: part });
  }
  return out;
}

export const norm = (s: string) => s.trim().toLowerCase();

const CONNECTOR = /^\s*(und|oder|sowie|&|\/|,)\s*$/i;

/** Gruppen austauschbarer Lücken (jede Lücke steht in genau einer Gruppe) */
export function groupGaps(segs: Seg[]): number[][] {
  const groups: number[][] = [];
  let last: Seg | null = null;
  let between = '';
  for (const s of segs) {
    if (s.kind === 'text') {
      between += s.text;
      continue;
    }
    if (last && last.kind === 'gap' && CONNECTOR.test(between) && groups.length) groups[groups.length - 1].push(s.n);
    else groups.push([s.n]);
    last = s;
    between = '';
  }
  return groups;
}

/** richtig/falsch je Lücke; `words[g]` ist das eingesetzte Wort (oder null) */
export function evaluateGaps(words: (string | null)[], answers: string[], groups: number[][]): boolean[] {
  const ok = words.map(() => false);
  for (const group of groups) {
    const left = group.map((g) => norm(answers[g]));
    // 1. Treffer an der richtigen Stelle
    for (const g of group) {
      const w = words[g];
      if (w !== null && norm(w) === norm(answers[g])) {
        ok[g] = true;
        left.splice(left.indexOf(norm(answers[g])), 1);
      }
    }
    // 2. Rest: richtiges Wort, aber an anderer Stelle derselben Gruppe
    for (const g of group) {
      if (ok[g]) continue;
      const w = words[g];
      const k = w === null ? -1 : left.indexOf(norm(w));
      if (k >= 0) {
        ok[g] = true;
        left.splice(k, 1);
      }
    }
  }
  return ok;
}
