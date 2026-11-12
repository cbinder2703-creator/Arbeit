import { describe, expect, it } from 'vitest';
import { evaluateGaps, groupGaps, parse } from './evaluate';

const run = (text: string, words: (string | null)[]) => {
  const segs = parse(text);
  const answers = segs.flatMap((s) => (s.kind === 'gap' ? [s.answer] : []));
  return { groups: groupGaps(segs), ok: evaluateGaps(words, answers, groupGaps(segs)) };
};

const T = 'Im dualen System teilen sich {{Berufsschule}} und {{Ausbildungsbetrieb}} die Ausbildung. Für das Handwerk gilt die {{Handwerksordnung}}, für alle übrigen das {{Berufsbildungsgesetz}}.';

describe('Lückentext-Auswertung', () => {
  it('„A und B“: beide Reihenfolgen sind richtig', () => {
    expect(run(T, ['Berufsschule', 'Ausbildungsbetrieb', 'Handwerksordnung', 'Berufsbildungsgesetz']).ok).toEqual([true, true, true, true]);
    expect(run(T, ['Ausbildungsbetrieb', 'Berufsschule', 'Handwerksordnung', 'Berufsbildungsgesetz']).ok).toEqual([true, true, true, true]);
  });
  it('Gruppen: nur direkt verbundene Lücken (hier die ersten beiden)', () => {
    expect(run(T, [null, null, null, null]).groups).toEqual([[0, 1], [2], [3]]);
  });
  it('über Satzteile hinweg bleibt die Reihenfolge wichtig', () => {
    expect(run(T, ['Berufsschule', 'Ausbildungsbetrieb', 'Berufsbildungsgesetz', 'Handwerksordnung']).ok).toEqual([true, true, false, false]);
  });
  it('ein falsches Wort in der Gruppe bleibt falsch, das richtige zählt', () => {
    expect(run(T, ['Ausbildungsbetrieb', 'Kammer', 'Handwerksordnung', 'Berufsbildungsgesetz']).ok).toEqual([true, false, true, true]);
    expect(run(T, ['Kammer', 'Kammer', 'Handwerksordnung', 'Berufsbildungsgesetz']).ok).toEqual([false, false, true, true]);
  });
  it('dasselbe Wort doppelt zählt nur einmal', () => {
    expect(run(T, ['Berufsschule', 'Berufsschule', 'Handwerksordnung', 'Berufsbildungsgesetz']).ok).toEqual([true, false, true, true]);
  });
  it('Komma, oder, sowie, Schrägstrich verbinden ebenfalls', () => {
    expect(run('{{A}}, {{B}} oder {{C}}', ['C', 'A', 'B']).ok).toEqual([true, true, true]);
    expect(run('{{A}} / {{B}}', ['B', 'A']).ok).toEqual([true, true]);
    expect(run('{{A}} sowie {{B}}', ['B', 'A']).ok).toEqual([true, true]);
    expect(run('{{A}} nach dem {{B}}', ['B', 'A']).ok).toEqual([false, false]);
  });
  it('leere Lücke ist falsch', () => {
    expect(run(T, ['Berufsschule', null, 'Handwerksordnung', 'Berufsbildungsgesetz']).ok).toEqual([true, false, true, true]);
  });
});
