import { useSearchParams } from 'react-router-dom';
import { usePruefung } from '@/app/pruefungContext';
import { PruefungsShell } from '@/app/PruefungsShell';
import { allModes } from '@/modes/registry';
import { isModeAvailable } from '@/engine/session';
import { playPath } from '@/engine/pickMode';
import { useFortschritt } from '@/store/progress';
import { ModeCard } from '@/ui/ModeCard';

export function Modi() {
  const pr = usePruefung();
  const { meta } = pr;
  const fort = useFortschritt(meta.id);
  const [params, setParams] = useSearchParams();
  const kap = params.get('kapitel') ?? 'alle';
  const chapterId = pr.chapters.some((c) => c.id === kap) ? kap : 'alle';
  const ids = chapterId === 'alle' ? undefined : [chapterId];
  const chapter = pr.chapters.find((c) => c.id === chapterId);

  return (
    <PruefungsShell>
      <div className="mx-auto max-w-6xl px-4 pt-5 lg:px-10 lg:pt-10">
        <h1 className="text-3xl">Spielmodi</h1>
        <p className="mt-1 text-mute">Wähle ein Kapitel und einen Modus.</p>

        <div className="scroll-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0" role="tablist" aria-label="Kapitel wählen">
          {[{ id: 'alle', label: 'Alle Kapitel', color: meta.color }, ...pr.chapters.map((c) => ({ id: c.id, label: `K${c.chapter} · ${c.title}`, color: c.color }))].map((c) => {
            const active = c.id === chapterId;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                onClick={() => setParams(c.id === 'alle' ? {} : { kapitel: c.id }, { replace: true })}
                className="tap shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-bold transition"
                style={active ? { background: c.color, borderColor: c.color, color: '#fff' } : { borderColor: '#2A3352', color: '#94A3B8' }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        {chapter && <p className="mt-3 text-sm text-mute">{chapter.subtitle}</p>}

        {(() => {
          // nur Modi, die in DIESER Prüfung überhaupt Inhalte haben; die im gewählten Kapitel fehlenden klappen wir ein
          const forExam = allModes.filter((m) => isModeAvailable(m, pr));
          const playable = forExam.filter((m) => isModeAvailable(m, pr, ids));
          const hidden = forExam.filter((m) => !isModeAvailable(m, pr, ids));
          const card = (m: (typeof allModes)[number], ok: boolean) => (
            <ModeCard
              key={m.id}
              mode={m}
              available={ok}
              to={playPath(meta.id, m.id, chapterId === 'alle' ? undefined : chapterId)}
              best={fort.bestScores[`${m.id}:${chapterId}`]}
            />
          );
          return (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{playable.map((m) => card(m, true))}</div>
              {hidden.length > 0 && (
                <details className="mt-5 rounded-2xl bg-card/60 p-3">
                  <summary className="tap cursor-pointer text-sm font-semibold text-mute">
                    {hidden.length} weitere {hidden.length === 1 ? 'Modus' : 'Modi'} – in diesem Kapitel nicht verfügbar
                  </summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{hidden.map((m) => card(m, false))}</div>
                </details>
              )}
              <p className="mt-4 text-xs text-mute">
                {playable.length} Spielmodi für diese Auswahl
                {forExam.length !== playable.length ? ` · ${forExam.length} in dieser Prüfung` : ''}.
              </p>
            </>
          );
        })()}
      </div>
    </PruefungsShell>
  );
}
