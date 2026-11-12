import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePruefung } from '@/app/pruefungContext';
import { PruefungsShell } from '@/app/PruefungsShell';
import { useFortschritt } from '@/store/progress';
import { Icon } from '@/ui/Icon';
import { Chip } from '@/ui/Chip';
import { Button } from '@/ui/Button';
import { playPath } from '@/engine/pickMode';
import { dayString } from '@/engine/dates';
import { isDue } from '@/engine/leitner';

/** Route /p/:pruefungId/karten – alle Lernkarten dieser Prüfung zum Nachschlagen und Lernen */
export function Karten() {
  const pr = usePruefung();
  const fort = useFortschritt(pr.meta.id);
  const [params, setParams] = useSearchParams();
  const kap = params.get('kapitel') ?? 'alle';
  const chapterId = pr.chapters.some((c) => c.id === kap) ? kap : 'alle';
  const [open, setOpen] = useState<Set<string>>(new Set());
  const today = dayString();
  const chapters = pr.chapters.filter((c) => chapterId === 'alle' || c.id === chapterId);
  const count = chapters.reduce((n, c) => n + c.flashcards.length, 0);

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <PruefungsShell>
      <div className="mx-auto max-w-6xl px-4 pt-5 lg:px-10 lg:pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl">Lernkarten</h1>
            <p className="mt-1 text-mute">{count} Karten zum Nachschlagen – antippen zeigt die Erklärung.</p>
          </div>
          <Link to={playPath(pr.meta.id, 'lernkarten', chapterId === 'alle' ? undefined : chapterId)}>
            <Button variant="theme">
              <Icon name="play" size={18} /> Lernen starten
            </Button>
          </Link>
        </div>

        <div className="scroll-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="tablist" aria-label="Kapitel wählen">
          {[{ id: 'alle', label: 'Alle Kapitel', color: pr.meta.color }, ...pr.chapters.map((c) => ({ id: c.id, label: `K${c.chapter} · ${c.title}`, color: c.color }))].map((c) => {
            const active = c.id === chapterId;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                onClick={() => setParams(c.id === 'alle' ? {} : { kapitel: c.id }, { replace: true })}
                className="tap shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-bold"
                style={active ? { background: c.color, borderColor: c.color, color: '#fff' } : { borderColor: '#2A3352', color: '#94A3B8' }}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {chapters.map((c) => (
          <section key={c.id} className="mt-6" aria-labelledby={`h-${c.id}`}>
            <h2 id={`h-${c.id}`} className="mb-2 flex items-center gap-2 text-lg">
              <Chip color={c.color}>K{c.chapter}</Chip> {c.title}
            </h2>
            <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {c.flashcards.map((f) => {
                const e = fort.leitner[f.id];
                const isOpen = open.has(f.id);
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => toggle(f.id)}
                      aria-expanded={isOpen}
                      className="tap block h-full w-full rounded-2xl bg-card p-3.5 text-left transition hover:bg-card-hi"
                      style={{ borderLeft: `4px solid ${c.color}` }}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-display text-[16px] leading-snug">{f.term}</span>
                        {e && (
                          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${isDue(e, today) ? 'bg-xp/20 text-xp' : 'bg-line text-mute'}`}>
                            Box {e.box}
                          </span>
                        )}
                      </span>
                      {isOpen ? (
                        <span className="mt-2 block text-[14px] leading-relaxed text-ink/90">{f.definition}</span>
                      ) : (
                        <span className="mt-1 block text-xs text-mute">Tippen für die Erklärung</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </PruefungsShell>
  );
}
