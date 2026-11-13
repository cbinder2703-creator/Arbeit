import { useEffect, useMemo, useRef, useState } from 'react';
import { findTerms, glossaryCards, searchCards } from '@/engine/glossary';
import type { GlossaryCard } from '@/engine/glossary';
import { useOptionalPruefung } from '@/app/pruefungContext';
import { Icon } from './Icon';
import { Button } from './Button';
import { SpeakButton } from './SpeakButton';

function CardView({ c, open }: { c: GlossaryCard; open?: boolean }) {
  return (
    <details open={open} className="group rounded-2xl bg-card-hi" style={{ borderLeft: `4px solid ${c.chapterColor}` }}>
      <summary className="tap flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-3">
        <span className="font-display text-[16px] leading-snug">{c.term}</span>
        <Icon name="chevron-right" size={18} className="shrink-0 text-mute transition group-open:rotate-90" />
      </summary>
      <div className="flex items-start gap-2 px-3.5 pb-3.5">
        <p className="flex-1 text-[15px] leading-relaxed text-ink/90">{c.definition}</p>
        <SpeakButton text={c.term} label={`„${c.term}“ vorlesen`} />
      </div>
    </details>
  );
}

/** Bottom-Sheet „Begriffe nachschlagen“: passende Begriffe zur Aufgabe + Suche im ganzen Glossar */
export function GlossarSheet({ text, onClose }: { text: string; onClose: () => void }) {
  const pr = useOptionalPruefung();
  const [query, setQuery] = useState('');
  const closeBtn = useRef<HTMLButtonElement>(null);
  const all = useMemo(() => (pr ? glossaryCards(pr) : []), [pr]);
  const matches = useMemo(() => findTerms(text, all, 6), [text, all]);
  const results = useMemo(() => (query.trim() ? searchCards(query, all).slice(0, 30) : []), [query, all]);

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60]" data-modal-open role="dialog" aria-modal="true" aria-label="Begriffe nachschlagen">
      <button aria-label="Schließen" className="absolute inset-0 bg-black/60" onClick={onClose} tabIndex={-1} />
      <div className="animate-sheet absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] max-w-2xl flex-col rounded-t-3xl border-t-2 border-line bg-card shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
          <h2 className="flex items-center gap-2 text-xl">
            <Icon name="lightbulb" className="text-xp" /> Begriffe nachschlagen
          </h2>
          <button ref={closeBtn} onClick={onClose} aria-label="Schließen" className="tap grid place-items-center rounded-xl text-mute hover:bg-card-hi hover:text-ink">
            <Icon name="x" size={24} />
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-4">
          <section aria-label="Passend zu dieser Aufgabe">
            <h3 className="mb-2 text-sm font-semibold text-mute">Passend zu dieser Aufgabe</h3>
            {matches.length > 0 ? (
              <div className="space-y-2">
                {matches.map((c, i) => (
                  <CardView key={c.id} c={c} open={i === 0} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-card-hi p-3.5 text-[15px] text-mute">
                Zu den Wörtern in dieser Aufgabe gibt es keine passende Erklärung im Lernmaterial. Suche unten nach einem Stichwort.
              </p>
            )}
          </section>

          <section className="mt-5" aria-label="Alle Begriffe durchsuchen">
            <h3 className="mb-2 text-sm font-semibold text-mute">Alle Begriffe durchsuchen</h3>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Stichwort eingeben, z. B. Probezeit"
              aria-label="Begriff suchen"
              className="tap w-full rounded-2xl border-2 border-line bg-bg px-4 text-[16px] outline-none focus:border-xp"
            />
            {query.trim() && (
              <div className="mt-3 space-y-2">
                {results.length === 0 && <p className="text-sm text-mute">Nichts gefunden.</p>}
                {results.map((c) => (
                  <CardView key={c.id} c={c} />
                ))}
              </div>
            )}
          </section>
          <Button variant="secondary" block className="mt-5" onClick={onClose}>
            Zurück zur Aufgabe
          </Button>
        </div>
      </div>
    </div>
  );
}
