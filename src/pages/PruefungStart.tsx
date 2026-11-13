import { Link } from 'react-router-dom';
import { usePruefung } from '@/app/pruefungContext';
import { PruefungsShell } from '@/app/PruefungsShell';
import { useFortschritt } from '@/store/progress';
import { dayString, daysUntil } from '@/engine/dates';
import {
  chapterStats, dailyTarget, dueTotal, examStatus, heuteDran, levelOf, recentAccuracy,
} from '@/engine/stats';
import { allModes } from '@/modes/registry';
import { isModeAvailable } from '@/engine/session';
import { pickDefaultMode, playPath } from '@/engine/pickMode';
import { Icon } from '@/ui/Icon';
import { Chip } from '@/ui/Chip';
import { ProgressBar } from '@/ui/ProgressBar';
import { ProgressRing } from '@/ui/ProgressRing';
import { ModeCard } from '@/ui/ModeCard';
import { BadgeList } from '@/ui/BadgeList';
import { hasPath, nextLesson, pathProgress } from '@/engine/path';

function Stat({ label, value, sub, color, bar }: { label: string; value: string; sub: string; color: string; bar?: number }) {
  return (
    <div className="min-w-0 rounded-2xl bg-card p-3.5 pl-4" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="text-xs text-mute">{label}</div>
      <div className="font-display text-2xl leading-tight">{value}</div>
      <div className="text-xs text-mute">{sub}</div>
      {bar !== undefined && <ProgressBar percent={bar} color={color} className="mt-2" height={5} />}
    </div>
  );
}

export function PruefungStart() {
  const pr = usePruefung();
  const { meta } = pr;
  const fort = useFortschritt(meta.id);
  const today = dayString();
  const lvl = levelOf(fort);
  const stats = chapterStats(pr, fort, today);
  const heute = heuteDran(pr, fort, today);
  const heuteKap = pr.chapters.find((c) => c.id === heute.chapterId)!;
  const target = dailyTarget(pr, fort, today);
  const days = daysUntil(meta.examDate, today);
  const acc = recentAccuracy(fort, today);
  const due = dueTotal(pr, fort, today);
  const exam = examStatus(pr, fort);
  const defMode = pickDefaultMode(allModes, pr, heuteKap.id);
  const heuteTo = defMode ? playPath(meta.id, defMode.id, heuteKap.id) : `/p/${meta.id}/modi?kapitel=${heuteKap.id}`;
  const modes = allModes.filter((m) => isModeAvailable(m, pr));
  const path = hasPath(pr);
  const nextL = path ? nextLesson(pr, fort) : null;
  const pp = path ? pathProgress(pr, fort) : null;

  const countdownLine =
    days === null
      ? 'Kein Prüfungstermin eingetragen'
      : days < 0
        ? 'Der Prüfungstermin ist vorbei'
        : days === 0
          ? 'Die Prüfung ist heute – viel Erfolg!'
          : `Noch ${days} ${days === 1 ? 'Tag' : 'Tage'}${target ? ` · heute ${target} Aufgaben üben` : ''}`;

  return (
    <PruefungsShell hero>
      {/* Kopfbereich im Thema der Prüfung */}
      <section className="pattern-bg bg-gradient-to-br from-p to-[var(--p-dark)] px-4 pb-6 pt-[calc(var(--safe-top)+1rem)] text-white lg:px-10 lg:py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 lg:hidden">
              <Link to="/" className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-white/90">
                <Icon name="chevron-left" size={16} /> Meine Prüfungen
              </Link>
              {fort.streak > 0 && (
                <Chip className="bg-black/25 text-white">
                  <Icon name="flame" size={13} /> {fort.streak} {fort.streak === 1 ? 'Tag' : 'Tage'}
                </Chip>
              )}
            </div>
            <h1 className="mt-2 text-4xl leading-tight lg:mt-0 lg:text-5xl">{meta.gameTitle}</h1>
            <p className="mt-2 text-[15px] text-white/90">
              Prüfung: {meta.title}
              {fort.bestGrade ? ` · Beste Note: ${fort.bestGrade}` : ''}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white/90">{countdownLine}</p>
          </div>
          <Link
            to={heuteTo}
            className="tap hidden items-center gap-2 rounded-2xl bg-white px-6 py-3 font-bold text-[var(--p-dark)] shadow-lg transition hover:scale-[1.02] lg:inline-flex"
          >
            <Icon name="play" size={18} /> Heute dran
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-7 px-4 pt-5 lg:px-10 lg:pt-8">
        {/* Level + Kennzahlen */}
        <section aria-label="Kennzahlen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Level" value={String(lvl.level)} sub={`${lvl.into} / ${lvl.needed} XP`} color="#FACC15" bar={(lvl.into / lvl.needed) * 100} />
          <Stat
            label="Prüfung in"
            value={days === null ? '–' : days < 0 ? 'vorbei' : `${days} ${days === 1 ? 'Tag' : 'Tagen'}`}
            sub={days === null ? 'kein Termin eingetragen' : target ? `heute ${target} Aufgaben` : 'alles geschafft'}
            color={meta.color}
          />
          <Stat label="Richtig" value={acc ? `${acc.percent} %` : '–'} sub={acc ? 'letzte 7 Tage' : 'noch nichts gespielt'} color="#22C55E" />
          <Stat label="Fällig" value={String(due)} sub="Wiederholungen" color="#3B82F6" />
        </section>

        {/* Lernpfad: nächste Lektion */}
        {path && pp && (
          <section aria-label="Lernpfad">
            <Link
              to={nextL ? `/p/${meta.id}/lektion/${nextL.lesson.id}` : `/p/${meta.id}/pfad`}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-p to-[var(--p-dark)] p-4 text-white shadow-lg active:scale-[0.99]"
            >
              <ProgressRing percent={pp.percent} size={52} color="#FFFFFF" stroke={5} label={`${pp.done}/${pp.total}`} />
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold tracking-wider opacity-80">{nextL ? 'WEITER LERNEN' : 'LERNPFAD GESCHAFFT'}</div>
                <div className="truncate font-display text-lg">{nextL ? `Lektion ${nextL.index + 1}: ${nextL.lesson.title}` : 'Alle Lektionen abgeschlossen'}</div>
                <div className="text-xs opacity-90">{nextL ? nextL.chapter.title : 'Wiederhole sie jederzeit im Lernpfad'}</div>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[var(--p-color)]">
                <Icon name="play" />
              </span>
            </Link>
          </section>
        )}

        {/* Heute dran */}
        <section aria-label="Heute dran" className="lg:hidden">
          <Link
            to={heuteTo}
            className="flex items-center gap-3 rounded-2xl border-2 border-p bg-p/10 p-4 active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold tracking-wider text-p-accent">HEUTE DRAN</div>
              <div className="truncate font-display text-lg">
                K{heuteKap.chapter} · {heuteKap.title}
              </div>
              <div className="text-xs text-mute">
                {heute.reason === 'faellig' ? `${heute.due} Wiederholungen fällig` : heute.reason === 'neu' ? 'Neue Aufgaben warten' : 'Zeit zum Auffrischen'}
              </div>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-p text-white">
              <Icon name="play" />
            </span>
          </Link>
        </section>

        {/* Kapitel */}
        <section aria-labelledby="kap-h">
          <h2 id="kap-h" className="mb-3 text-xl">Kapitel</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {pr.chapters.map((c, i) => {
              const s = stats[i];
              return (
                <Link
                  key={c.id}
                  to={`/p/${meta.id}/modi?kapitel=${c.id}`}
                  className="block min-w-0 rounded-2xl bg-card p-3.5 transition hover:bg-card-hi active:scale-[0.99]"
                  style={{ borderTop: `4px solid ${c.color}` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Chip color={c.color}>K{c.chapter}</Chip>
                    <ProgressRing percent={s.percent} color={c.color} size={42} stroke={4} />
                  </div>
                  <div lang="de" className="mt-2 hyphens-auto break-words font-display text-[15px] leading-snug">{c.title}</div>
                  <div className="text-xs text-mute">{c.pages.replace('Buch ', '')}</div>
                  <ProgressBar percent={s.percent} color={c.color} className="mt-2.5" height={5} />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Abschlussprüfung */}
        <section aria-label="Abschlussprüfung">
          <Link
            to={`/p/${meta.id}/abschluss`}
            className={`flex items-center gap-3 rounded-2xl border-2 border-dashed p-4 active:scale-[0.99] ${exam.unlocked ? 'border-good bg-good/10' : 'border-xp/60 bg-xp/10'}`}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-black/25 text-xp">
              <Icon name="crown" size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-display text-lg text-xp">{meta.finalExam.title}</div>
              <div className="text-xs text-mute">
                Endgegner · {meta.finalExam.questions} Aufgaben · Note nach IHK-Schlüssel
              </div>
              <div className="text-xs font-bold text-xp">
                {exam.unlocked
                  ? 'Freigeschaltet – du kannst starten!'
                  : `frei ab ${exam.need} % – du hast ${exam.percent} %`}
              </div>
            </div>
            <Icon name={exam.unlocked ? 'unlock' : 'lock'} className="text-xp" />
          </Link>
        </section>

        {/* Spielmodi: ab 1024 px direkt hier, mobil über den Tab „Spielmodi“ */}
        <section aria-labelledby="modi-h" className="hidden lg:block">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 id="modi-h" className="text-xl">Spielmodi</h2>
            <span className="text-sm text-mute">neue Modi erscheinen automatisch in jeder Prüfung</span>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {modes.map((m) => (
              <ModeCard key={m.id} mode={m} available to={playPath(meta.id, m.id)} best={fort.bestScores[`${m.id}:alle`]} />
            ))}
          </div>
        </section>
        {meta.badges.length > 0 && (
          <section aria-labelledby="badge-h">
            <h2 id="badge-h" className="mb-3 text-xl">Abzeichen <span className="text-sm font-normal text-mute">{fort.badges.length} von {meta.badges.length}</span></h2>
            <BadgeList badges={meta.badges} earned={fort.badges} />
          </section>
        )}
        <section className="lg:hidden">
          <Link to={`/p/${meta.id}/modi`} className="flex items-center justify-between rounded-2xl bg-card p-4 font-semibold">
            <span className="flex items-center gap-3"><Icon name="gamepad" className="text-p-accent" /> Alle {modes.length} Spielmodi</span>
            <Icon name="chevron-right" className="text-mute" />
          </Link>
        </section>
      </div>
    </PruefungsShell>
  );
}
