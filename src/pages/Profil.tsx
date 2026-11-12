import { Link } from 'react-router-dom';
import { allePruefungen } from '@/content/loader';
import { useProgress } from '@/store/progress';
import { levelFromXp } from '@/engine/xp';
import { solvedPercent } from '@/engine/stats';
import { emptyProgress } from '@/store/types';
import { ProgressBar } from '@/ui/ProgressBar';
import { Icon } from '@/ui/Icon';
import { Settings } from '@/ui/Settings';
import { BadgeList } from '@/ui/BadgeList';
import { InstallHint } from '@/ui/InstallHint';

export function Profil() {
  const { byPruefung, globalStreak } = useProgress();
  const totalXp = Object.values(byPruefung).reduce((n, p) => n + p.xp, 0);
  const lvl = levelFromXp(totalXp);

  return (
    <div>
      <h1 className="text-3xl">Profil</h1>
      <p className="mt-1 text-mute">Deine Gesamtübersicht über alle Prüfungen.</p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl bg-card p-4">
          <div className="text-xs text-mute">Gesamt-XP</div>
          <div className="font-display text-3xl text-xp">{totalXp}</div>
          <div className="text-xs text-mute">Level {lvl.level}</div>
        </div>
        <div className="rounded-2xl bg-card p-4">
          <div className="text-xs text-mute">Tages-Streak</div>
          <div className="flex items-center gap-1 font-display text-3xl">
            <Icon name="flame" className="text-orange-400" size={26} /> {globalStreak}
          </div>
          <div className="text-xs text-mute">{globalStreak === 1 ? 'Tag' : 'Tage'} in Folge</div>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xl">Meine Prüfungen</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {allePruefungen.map((p) => {
          const f = byPruefung[p.meta.id] ?? emptyProgress();
          const pct = solvedPercent(p, f);
          return (
            <Link key={p.meta.id} to={`/p/${p.meta.id}`} className="block rounded-2xl bg-card p-4 transition hover:bg-card-hi" style={{ borderLeft: `4px solid ${p.meta.color}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-display text-lg">{p.meta.gameTitle}</div>
                  <div className="truncate text-xs text-mute">{p.meta.title}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-bold">Note {f.bestGrade ?? '–'}</div>
                  <div className="text-xs text-mute">{f.xp} XP</div>
                </div>
              </div>
              <ProgressBar percent={pct} color={p.meta.color} className="mt-3" height={6} />
            </Link>
          );
        })}
      </div>

      {allePruefungen.some((p) => p.meta.badges.length > 0) && (
        <>
          <h2 className="mb-3 mt-8 text-xl">Abzeichen</h2>
          <div className="space-y-5">
            {allePruefungen.map((p) => (
              <section key={p.meta.id} aria-label={`Abzeichen ${p.meta.gameTitle}`}>
                <h3 className="mb-2 text-sm font-semibold text-mute">{p.meta.gameTitle}</h3>
                <BadgeList badges={p.meta.badges} earned={(byPruefung[p.meta.id] ?? emptyProgress()).badges} />
              </section>
            ))}
          </div>
        </>
      )}

      <h2 className="mb-3 mt-8 text-xl">Einstellungen</h2>
      <Settings />
      <div className="mt-3">
        <InstallHint />
      </div>
    </div>
  );
}
