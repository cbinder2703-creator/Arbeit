import type { HQuestion } from './questions';

/** Kleine Kurve bzw. Balkengrafik; die beiden verglichenen Werte sind hervorgehoben */
export function MiniChart({ q }: { q: HQuestion }) {
  const colorA = '#FACC15';
  const colorB = '#3B82F6';
  const mark = (e: { label: string }) => (e.label === q.a.label ? colorA : e.label === q.b.label ? colorB : null);

  if (q.kind === 'curve') {
    const W = 320;
    const H = 130;
    const pad = 14;
    const vals = q.entries.map((e) => e.value);
    const max = Math.max(...vals);
    const min = Math.min(0, ...vals);
    const x = (i: number) => pad + (i * (W - 2 * pad)) / Math.max(1, q.entries.length - 1);
    const y = (v: number) => H - pad - ((v - min) / (max - min || 1)) * (H - 2 * pad);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Kurve: ${q.title}`}>
        <polyline fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinejoin="round" points={q.entries.map((e, i) => `${x(i)},${y(e.value)}`).join(' ')} />
        {q.entries.map((e, i) => {
          const c = mark(e);
          return c ? <circle key={i} cx={x(i)} cy={y(e.value)} r="7" fill={c} stroke="#0B1020" strokeWidth="2" /> : <circle key={i} cx={x(i)} cy={y(e.value)} r="2.5" fill="#64748B" />;
        })}
      </svg>
    );
  }
  const max = Math.max(...q.entries.map((e) => e.value));
  return (
    <ul className="space-y-1" aria-label={`Balken: ${q.title}`}>
      {q.entries.map((e) => {
        const c = mark(e);
        return (
          <li key={e.label} className="grid grid-cols-[minmax(0,42%)_1fr_auto] items-center gap-2 text-[11px] leading-tight">
            <span className={`truncate ${c ? 'font-bold text-ink' : 'text-mute'}`} title={e.label}>{e.label}</span>
            <span className="h-3 overflow-hidden rounded-full bg-line">
              <span className="block h-full rounded-full" style={{ width: `${(e.value / max) * 100}%`, background: c ?? '#475569' }} />
            </span>
            <span className={`w-12 text-right ${c ? 'font-bold text-ink' : 'text-mute'}`}>{e.value}{q.suffix}</span>
          </li>
        );
      })}
    </ul>
  );
}
