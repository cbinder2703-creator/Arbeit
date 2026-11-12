// Fragen werden zur Laufzeit aus den Datenpunkten (`charts`) erzeugt – nur Paare mit deutlichem Unterschied.
import type { Charts, ChartData } from '@/content/schema';
import { shuffle } from '@/engine/shuffle';
import type { Rng } from '@/engine/shuffle';

export interface Entry {
  label: string;
  value: number;
}

export interface HQuestion {
  id: string;
  datasetKey: string;
  title: string;
  source?: string;
  kind: 'curve' | 'bars';
  suffix: string;
  entries: Entry[];
  a: Entry;
  b: Entry;
}

const isChart = (c: unknown): c is ChartData => typeof c === 'object' && c !== null && ('points' in c || 'values' in c);

export function entriesOf(ds: ChartData): Entry[] {
  if (ds.points) {
    return ds.points.map(([x, v]) => ({
      label: typeof x === 'number' ? (ds.unit === 'Uhrzeit' ? `${x} Uhr` : ds.unit === 'Jahre' ? `${x} Jahre` : String(x)) : x,
      value: v,
    }));
  }
  return (ds.values ?? []).map(([label, value]) => ({ label, value }));
}

/** Mindestabstand: 10 Punkte bei Prozent/Kurven, 0,5 Std. bei Stunden, sonst 15 % der Spannweite */
export function thresholdFor(ds: ChartData, entries: Entry[]): number {
  if (/%/.test(ds.title) || ds.points) return 10;
  if (/Stunden/i.test(ds.title)) return 0.5;
  const vals = entries.map((e) => e.value);
  return (Math.max(...vals) - Math.min(...vals)) * 0.15;
}

export const suffixFor = (ds: ChartData): string => (/%/.test(ds.title) ? ' %' : /Stunden/i.test(ds.title) ? ' Std.' : '');

export function buildQuestions(charts: Charts | undefined, count: number, rng: Rng = Math.random): HQuestion[] {
  if (!charts) return [];
  const perDataset: HQuestion[][] = [];
  for (const [key, ds] of Object.entries(charts)) {
    if (!isChart(ds)) continue;
    const entries = entriesOf(ds);
    const th = thresholdFor(ds, entries);
    const qs: HQuestion[] = [];
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        if (Math.abs(entries[i].value - entries[j].value) < th) continue;
        const flip = rng() < 0.5;
        qs.push({
          id: `chart:${key}:${entries[i].label}|${entries[j].label}`,
          datasetKey: key,
          title: ds.title,
          source: ds.source,
          kind: ds.points ? 'curve' : 'bars',
          suffix: suffixFor(ds),
          entries,
          a: flip ? entries[j] : entries[i],
          b: flip ? entries[i] : entries[j],
        });
      }
    }
    if (qs.length) perDataset.push(shuffle(qs, rng));
  }
  // reihum aus allen Diagrammen ziehen, damit die Runde abwechslungsreich ist
  const out: HQuestion[] = [];
  const order = shuffle(perDataset, rng);
  for (let k = 0; out.length < count && order.some((q) => q.length > k); k++) {
    for (const q of order) if (q[k] && out.length < count) out.push(q[k]);
  }
  return shuffle(out, rng);
}
