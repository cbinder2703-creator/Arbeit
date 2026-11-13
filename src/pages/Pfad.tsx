import { Link } from 'react-router-dom';
import { usePruefung } from '@/app/pruefungContext';
import { PruefungsShell } from '@/app/PruefungsShell';
import { useFortschritt } from '@/store/progress';
import { nextLesson, pathLessons, pathProgress } from '@/engine/path';
import { Icon } from '@/ui/Icon';
import { ProgressBar } from '@/ui/ProgressBar';

const OFFSETS = [0, 44, 0, -44]; // Zickzack

/** Route /p/:pruefungId/pfad – der Lernpfad (Lektionen nacheinander freischalten) */
export function Pfad() {
  const pr = usePruefung();
  const { meta } = pr;
  const fort = useFortschritt(meta.id);
  const lessons = pathLessons(pr, fort);
  const next = nextLesson(pr, fort);
  const prog = pathProgress(pr, fort);

  return (
    <PruefungsShell>
      <div className="mx-auto max-w-xl px-4 pt-5 lg:pt-10">
        <h1 className="text-3xl">Lernpfad</h1>
        <p className="mt-1 text-mute">Eine Lektion nach der anderen – jede mit kurzer Erklärung.</p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar percent={prog.percent} className="flex-1" label="Lernpfad-Fortschritt" />
          <span className="text-sm font-bold">{prog.done}/{prog.total}</span>
        </div>

        {pr.chapters
          .filter((c) => c.lessons.length > 0)
          .map((c) => (
            <section key={c.id} className="mt-8" aria-labelledby={`unit-${c.id}`}>
              <div className="rounded-2xl p-4 text-white" style={{ background: c.color }}>
                <div className="text-xs font-bold tracking-widest opacity-80">EINHEIT {c.chapter}</div>
                <h2 id={`unit-${c.id}`} className="text-2xl leading-tight">{c.title}</h2>
                {c.subtitle && <p className="mt-0.5 text-sm opacity-90">{c.subtitle}</p>}
              </div>

              <ol className="mt-5 flex flex-col items-center gap-5">
                {lessons
                  .filter((l) => l.chapter.id === c.id)
                  .map((l, i) => {
                    const isNext = next?.lesson.id === l.lesson.id;
                    const label = l.unlocked
                      ? `Lektion ${l.index + 1}: ${l.lesson.title}${l.done ? `, ${l.stars} von 3 Sternen` : ''}`
                      : `Lektion ${l.index + 1}: ${l.lesson.title} – gesperrt, schließe zuerst die Lektion davor ab`;
                    const node = (
                      <span
                        className={`relative grid h-[76px] w-[76px] place-items-center rounded-full border-b-[6px] text-white transition ${
                          l.unlocked ? 'active:translate-y-[3px] active:border-b-[3px]' : 'opacity-50'
                        } ${isNext ? 'ring-4 ring-xp/60' : ''}`}
                        style={{
                          background: l.unlocked ? c.color : '#2A3352',
                          borderColor: l.unlocked ? 'rgba(0,0,0,0.3)' : '#1E2640',
                        }}
                      >
                        <Icon name={l.unlocked ? (l.done ? 'check' : l.lesson.icon) : 'lock'} size={32} strokeWidth={l.done ? 3.5 : 2.2} />
                        {isNext && (
                          <span className="absolute -top-5 rounded-lg bg-xp px-2 py-0.5 text-[11px] font-bold text-[#1a1400]">START</span>
                        )}
                      </span>
                    );
                    return (
                      <li key={l.lesson.id} className="flex flex-col items-center" style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)` }}>
                        {l.unlocked ? (
                          <Link to={`/p/${meta.id}/lektion/${l.lesson.id}`} aria-label={label} className="tap rounded-full">
                            {node}
                          </Link>
                        ) : (
                          <div role="img" aria-label={label}>{node}</div>
                        )}
                        <div className="mt-2 flex gap-0.5" aria-hidden="true">
                          {[1, 2, 3].map((n) => (
                            <Icon key={n} name="star" size={15} className={n <= l.stars ? 'fill-xp text-xp' : 'text-line'} />
                          ))}
                        </div>
                        <span className="mt-0.5 max-w-[150px] text-center text-sm font-semibold leading-tight">{l.lesson.title}</span>
                        {l.lesson.subtitle && <span className="max-w-[170px] text-center text-xs text-mute">{l.lesson.subtitle}</span>}
                      </li>
                    );
                  })}
              </ol>
            </section>
          ))}

        {!next && prog.total > 0 && (
          <p role="status" className="mt-8 rounded-2xl border border-good/40 bg-good/10 p-4 text-center font-semibold">
            Alle Lektionen geschafft! Jetzt wartet der Abschlusstest. 🎉
          </p>
        )}
      </div>
    </PruefungsShell>
  );
}
