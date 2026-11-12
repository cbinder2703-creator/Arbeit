import { useMemo } from 'react';
import { allePruefungen, alleErrors } from '@/content/loader';
import { PruefungsKachel } from '@/ui/PruefungsKachel';
import { Icon } from '@/ui/Icon';
import { useProgress } from '@/store/progress';
import { levelFromXp } from '@/engine/xp';
import { daysUntil, dayString } from '@/engine/dates';
import { Chip } from '@/ui/Chip';

/** Sortierung: nächster Termin zuerst, vergangene danach, ohne Termin ans Ende */
function sortKey(date: string | null, today: string): number {
  const d = daysUntil(date, today);
  if (d === null) return Number.MAX_SAFE_INTEGER;
  return d >= 0 ? d : 100_000 - d;
}

export function MeinePruefungen() {
  const byPruefung = useProgress((s) => s.byPruefung);
  const totalXp = Object.values(byPruefung).reduce((n, p) => n + p.xp, 0);
  const lvl = levelFromXp(totalXp);
  const sorted = useMemo(() => {
    const today = dayString();
    return [...allePruefungen].sort((a, b) => sortKey(a.meta.examDate, today) - sortKey(b.meta.examDate, today));
  }, []);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl">Meine Prüfungen</h1>
          <p className="mt-1 text-mute">Jede Prüfung ist ein eigenes Spiel.</p>
        </div>
        <Chip color="#FACC15" className="mt-2 !text-xs">Lvl {lvl.level}</Chip>
      </div>

      {alleErrors.length > 0 && (
        <div role="alert" className="mt-4 rounded-2xl border border-bad/40 bg-bad/10 p-4 text-sm">
          <b>Inhaltsfehler gefunden</b> – bitte <code>npm run validate-content</code> ausführen.
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((p, i) => (
          <PruefungsKachel key={p.meta.id} pruefung={p} index={i} />
        ))}
        <div className="flex min-h-[148px] items-center gap-4 rounded-xl3 border-2 border-dashed border-line p-5 text-mute">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card-hi">
            <Icon name="plus" />
          </span>
          <div>
            <div className="font-display text-lg text-ink">Neue Prüfung kommt bald</div>
            <p className="text-sm">Jede neue Prüfung erscheint hier automatisch als eigenes Spiel.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
