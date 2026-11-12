import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { Button } from './Button';
import { ProgressBar } from './ProgressBar';
import { Confetti } from './Confetti';
import { levelFromXp } from '@/engine/xp';
import type { RoundOutcome } from '@/engine/rounds';

export interface WrongEntry {
  id: string;
  title: string;
  answer: string;
  explanation?: string;
  law?: string;
}

export interface ResultData {
  score: number;
  correct: number;
  total: number;
  stars: number;
  outcome: RoundOutcome;
  wrong: WrongEntry[];
  statText?: string;
  badges?: { id: string; title: string }[];
  title?: string;
  /** Modi ohne Punktedruck (Lernkarten) */
  noScore?: boolean;
}

/** Gemeinsamer Ergebnisbildschirm der Engine: Sterne, Punkte, XP-Balken, Fehler mit Erklärung */
export function RoundResult({
  data,
  onAgain,
  onPracticeWrong,
  onBack,
  backLabel = 'Zurück zu den Modi',
}: {
  data: ResultData;
  onAgain: () => void;
  onPracticeWrong?: () => void;
  onBack: () => void;
  backLabel?: string;
}) {
  const { outcome } = data;
  const lvl = levelFromXp(outcome.xpAfter);
  const levelUp = outcome.levelAfter > outcome.levelBefore;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-[calc(var(--safe-top)+1.5rem)]" data-testid="result">
      {data.stars === 3 && <Confetti />}
      <div className="text-center">
        <div className="flex justify-center gap-2" aria-label={`${data.stars} von 3 Sternen`}>
          {[1, 2, 3].map((n) => (
            <motion.span
              key={n}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1 * n, type: 'spring', stiffness: 380, damping: 16 }}
            >
              <Icon name="star" size={n === 2 ? 56 : 44} strokeWidth={2} className={n <= data.stars ? 'fill-xp text-xp' : 'text-line'} />
            </motion.span>
          ))}
        </div>
        <h1 className="mt-3 text-3xl">
          {data.title ?? (data.stars === 3 ? 'Stark gespielt!' : data.stars === 2 ? 'Gut gemacht!' : data.stars === 1 ? 'Weiter so!' : 'Noch nicht ganz')}
        </h1>
        <p className="mt-1 text-mute">
          {data.correct} von {data.total} richtig
          {data.statText ? ` · ${data.statText}` : ''}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 text-center">
          <div className="text-xs text-mute">{data.noScore ? 'Gewusst' : 'Punkte'}</div>
          <div className="font-display text-3xl text-xp">{data.noScore ? `${data.correct}/${data.total}` : data.score}</div>
        </div>
        <div className="rounded-2xl bg-card p-4 text-center">
          <div className="text-xs text-mute">XP</div>
          <div className="font-display text-3xl text-p-accent">+{outcome.xp}</div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">Level {lvl.level}</span>
          <span className="text-xs text-mute">{lvl.into} / {lvl.needed} XP</span>
        </div>
        <ProgressBar percent={(lvl.into / lvl.needed) * 100} className="mt-2" />
        {levelUp && (
          <p role="status" className="mt-2 text-sm font-bold text-good">
            Level-Up! Du bist jetzt Level {outcome.levelAfter}.
          </p>
        )}
      </div>

      {data.badges && data.badges.length > 0 && (
        <div className="mt-3 rounded-2xl border border-xp/50 bg-xp/10 p-4">
          <div className="font-display text-lg text-xp">Neues Abzeichen!</div>
          <ul className="mt-1 flex flex-wrap gap-2">
            {data.badges.map((b) => (
              <li key={b.id} className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-sm font-bold">
                <Icon name="medal" size={14} className="text-xp" /> {b.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.wrong.length > 0 && (
        <section className="mt-6" aria-labelledby="wrong-h">
          <h2 id="wrong-h" className="mb-2 text-xl">Das kannst du noch üben</h2>
          <ul className="space-y-2">
            {data.wrong.map((w) => (
              <li key={w.id} className="rounded-2xl border border-bad/30 bg-card p-3.5">
                <div className="text-[15px] font-semibold leading-snug">{w.title}</div>
                <div className="mt-1.5 text-sm text-good">
                  <span className="font-bold">Richtig: </span>
                  {w.answer}
                </div>
                {w.explanation && <p className="mt-1 text-sm text-mute">{w.explanation}</p>}
                {w.law && <span className="mt-1.5 inline-block rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-400">{w.law}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onAgain} className="flex-1">
          <Icon name="reset" size={18} /> Nochmal
        </Button>
        {onPracticeWrong && data.wrong.length > 0 && (
          <Button variant="theme" onClick={onPracticeWrong} className="flex-1">
            Fehler üben ({data.wrong.length})
          </Button>
        )}
        <Button variant="secondary" onClick={onBack} className="flex-1">
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
