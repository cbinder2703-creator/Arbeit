import { Link } from 'react-router-dom';
import type { Pruefung } from '@/content/parse';
import { Icon } from './Icon';
import { themeStyle } from './PruefungsTheme';
import { Chip } from './Chip';
import { ProgressBar } from './ProgressBar';
import { useFortschritt } from '@/store/progress';
import { countdownText, solvedPercent } from '@/engine/stats';
import { dayString } from '@/engine/dates';
import { allModes } from '@/modes/registry';
import { isModeAvailable } from '@/engine/session';

/** Große Spiel-Kachel auf „Meine Prüfungen“ – übernimmt Farben und Muster der Prüfung */
export function PruefungsKachel({ pruefung, index }: { pruefung: Pruefung; index: number }) {
  const { meta } = pruefung;
  const fort = useFortschritt(meta.id);
  const today = dayString();
  const percent = solvedPercent(pruefung, fort);
  const countdown = countdownText(meta.examDate, today);
  const modeCount = allModes.filter((m) => isModeAvailable(m, pruefung)).length;

  return (
    <Link
      to={`/p/${meta.id}`}
      style={themeStyle(meta)}
      className="pattern-bg group relative block overflow-hidden rounded-xl3 bg-gradient-to-br from-p to-[var(--p-dark)] p-5 text-white shadow-lg shadow-black/30 transition active:scale-[0.99] lg:hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <Chip className="bg-black/25 text-white">PRÜFUNG {index + 1}</Chip>
        <Icon name={meta.icon} size={30} className="opacity-70" />
      </div>
      <h2 className="mt-4 font-display text-3xl leading-tight">{meta.gameTitle}</h2>
      <p className="mt-1 text-[15px] text-white/90">{meta.title}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {countdown && <Chip className="bg-black/25 text-white">{countdown}</Chip>}
        <Chip className="bg-black/25 text-white">Beste Note: {fort.bestGrade ?? '–'}</Chip>
        {fort.streak > 0 && (
          <Chip className="bg-black/25 text-white">
            <Icon name="flame" size={12} /> {fort.streak} {fort.streak === 1 ? 'Tag' : 'Tage'}
          </Chip>
        )}
      </div>
      <div className="mt-5 flex items-end gap-4">
        <div className="min-w-0 flex-1">
          <ProgressBar percent={percent} color="#FFFFFF" className="bg-black/25" />
          <p className="mt-2 text-xs text-white/85">
            {percent} % gelernt · {pruefung.chapters.length} Kapitel · {modeCount} Modi
          </p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[var(--p-color)] shadow-md transition group-hover:scale-105">
          <Icon name="play" size={22} />
        </span>
      </div>
    </Link>
  );
}
