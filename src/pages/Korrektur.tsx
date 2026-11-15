import { useMemo, useState } from 'react';
import { usePruefung } from '@/app/pruefungContext';
import { PruefungsShell } from '@/app/PruefungsShell';
import type { KorrekturStatus } from '@/content/schema';
import { Icon } from '@/ui/Icon';
import { NotFound } from './NotFound';

export const STATUS_INFO: Record<KorrekturStatus, { label: string; color: string; icon: string; hint: string }> = {
  fix: { label: 'Falsch', color: '#EF4444', icon: 'x', hint: 'Hier stimmt deine Antwort nicht' },
  partial: { label: 'Ungenau', color: '#FACC15', icon: 'info', hint: 'Fast richtig – ergänzen' },
  unsure: { label: 'Unsicher', color: '#94A3B8', icon: 'search', hint: 'Bitte im Unterricht klären' },
  missing: { label: 'Lösung', color: '#38BDF8', icon: 'lightbulb', hint: 'Hier fehlte die Antwort' },
  ok: { label: 'Richtig', color: '#22C55E', icon: 'check', hint: 'Deine Antwort stimmt' },
};
const ORDER: KorrekturStatus[] = ['fix', 'partial', 'unsure', 'missing', 'ok'];

/** Route /p/:pruefungId/korrektur – deine Arbeitsblätter, geprüft: Fehler, Lücken und richtige Lösungen */
export function Korrektur() {
  const pr = usePruefung();
  const k = pr.korrektur;
  const [filter, setFilter] = useState<'alle' | KorrekturStatus>('alle');
  const counts = useMemo(() => {
    const c: Record<KorrekturStatus, number> = { fix: 0, partial: 0, unsure: 0, missing: 0, ok: 0 };
    k?.sheets.forEach((s) => s.entries.forEach((e) => c[e.status]++));
    return c;
  }, [k]);
  if (!k) return <NotFound what="Diese Seite" />;
  const total = ORDER.reduce((n, s) => n + counts[s], 0);

  return (
    <PruefungsShell>
      <div className="mx-auto max-w-3xl px-4 pt-5 lg:px-10 lg:pt-10">
        <h1 className="text-3xl">{k.title}</h1>
        {k.intro && <p className="mt-2 text-[15px] leading-relaxed text-mute">{k.intro}</p>}

        <div role="tablist" aria-label="Filtern" className="scroll-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
          <button
            role="tab"
            aria-selected={filter === 'alle'}
            onClick={() => setFilter('alle')}
            className={`tap shrink-0 rounded-full border px-4 text-sm font-bold ${filter === 'alle' ? 'border-p bg-p text-white' : 'border-line text-mute'}`}
          >
            Alle ({total})
          </button>
          {ORDER.map((s) =>
            counts[s] ? (
              <button
                key={s}
                role="tab"
                aria-selected={filter === s}
                onClick={() => setFilter(s)}
                className="tap shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-bold"
                style={filter === s ? { background: STATUS_INFO[s].color, borderColor: STATUS_INFO[s].color, color: '#0B1020' } : { borderColor: '#2A3352', color: STATUS_INFO[s].color }}
              >
                {STATUS_INFO[s].label} ({counts[s]})
              </button>
            ) : null,
          )}
        </div>

        <div className="mt-5 space-y-7">
          {k.sheets.map((sheet) => {
            const entries = sheet.entries.filter((e) => filter === 'alle' || e.status === filter);
            if (!entries.length) return null;
            return (
              <section key={sheet.id} aria-labelledby={`sh-${sheet.id}`}>
                <div className="rounded-2xl p-3.5 text-white" style={{ background: sheet.color }}>
                  <h2 id={`sh-${sheet.id}`} className="text-xl leading-tight">{sheet.title}</h2>
                  {sheet.subtitle && <p className="text-sm opacity-90">{sheet.subtitle}</p>}
                </div>
                <ul className="mt-3 space-y-2.5">
                  {entries.map((e, i) => {
                    const st = STATUS_INFO[e.status];
                    return (
                      <li key={i} data-status={e.status} className="rounded-2xl bg-card p-3.5" style={{ borderLeft: `4px solid ${st.color}` }}>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-[16px] leading-snug">{e.task}</h3>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: st.color, background: `${st.color}26` }}>
                            <Icon name={st.icon} size={12} strokeWidth={3} /> {st.label}
                          </span>
                        </div>
                        {e.yours && (
                          <p className="mt-2 text-sm leading-snug">
                            <span className="font-bold text-mute">Deine Antwort: </span>
                            <span className="whitespace-pre-line">{e.yours}</span>
                          </p>
                        )}
                        <p className="mt-1.5 text-[15px] leading-relaxed">
                          <span className="font-bold" style={{ color: st.color }}>{e.status === 'ok' ? 'Stimmt: ' : e.status === 'missing' ? 'Lösung: ' : 'Richtig: '}</span>
                          <span className="whitespace-pre-line">{e.correct}</span>
                        </p>
                        {e.note && <p className="mt-1.5 text-sm italic text-mute">{e.note}</p>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </PruefungsShell>
  );
}
