import { Button } from './Button';
import { Icon } from './Icon';
import { Confetti } from './Confetti';
import { ProgressBar } from './ProgressBar';
import type { WrongEntry } from './RoundResult';
import type { ExamScore } from '@/engine/exam';
import { GRADE_LABEL } from '@/engine/grades';
import type { RoundOutcome } from '@/engine/rounds';
import { levelFromXp } from '@/engine/xp';

export interface ExamResultData {
  score: ExamScore;
  total: number;
  outcome: RoundOutcome;
  wrong: WrongEntry[];
  badges: { id: string; title: string }[];
  isBest: boolean;
}

export function ExamResult({
  data,
  onAgain,
  onPractice,
  onBack,
}: {
  data: ExamResultData;
  onAgain: () => void;
  onPractice: () => void;
  onBack: () => void;
}) {
  const { score } = data;
  const lvl = levelFromXp(data.outcome.xpAfter);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-[calc(var(--safe-top)+1.5rem)]" data-testid="exam-result">
      {score.passed && <Confetti count={60} />}
      <div className="text-center">
        <h1 className="text-3xl">{score.passed ? 'Bestanden!' : 'Noch nicht bestanden'}</h1>
        <p className="mt-1 text-mute">
          {score.passed ? 'Der Endgegner ist besiegt.' : 'Kein Problem – mit „Fehler üben“ holst du das nach.'}
        </p>
        <div
          className={`mx-auto mt-5 grid h-36 w-36 place-items-center rounded-full border-8 ${score.passed ? 'border-good bg-good/10' : 'border-bad bg-bad/10'}`}
          role="img"
          aria-label={`Note ${score.grade}`}
        >
          <div>
            <div className="text-xs font-bold tracking-widest text-mute">NOTE</div>
            <div className="font-display text-6xl leading-none" data-testid="grade">{score.grade}</div>
          </div>
        </div>
        <p className="mt-3 font-display text-xl">{GRADE_LABEL[score.grade]}</p>
        <p className="text-sm text-mute">
          {score.percent} % richtig{data.isBest ? ' · neue Bestnote!' : ''}
        </p>
      </div>

      <section className="mt-6 rounded-2xl bg-card p-4" aria-labelledby="kap-res">
        <h2 id="kap-res" className="mb-3 text-lg">Auswertung je Kapitel</h2>
        <ul className="space-y-3">
          {score.byChapter.map((c) => (
            <li key={c.chapterId}>
              <div className="flex justify-between text-sm">
                <span><b style={{ color: c.color }}>K{c.number}</b> {c.title}</span>
                <span className="font-bold">{c.percent} %</span>
              </div>
              <ProgressBar percent={c.percent} color={c.color} className="mt-1" height={7} />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-3 rounded-2xl bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold">Level {lvl.level}</span>
          <span className="text-xs text-mute">+{data.outcome.xp} XP</span>
        </div>
        <ProgressBar percent={(lvl.into / lvl.needed) * 100} className="mt-2" />
        {data.outcome.levelAfter > data.outcome.levelBefore && (
          <p role="status" className="mt-2 text-sm font-bold text-good">Level-Up! Du bist jetzt Level {data.outcome.levelAfter}.</p>
        )}
      </div>

      {data.badges.length > 0 && (
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
        <section className="mt-6" aria-labelledby="exam-wrong">
          <h2 id="exam-wrong" className="mb-2 text-xl">Das war nicht ganz richtig</h2>
          <ul className="space-y-2">
            {data.wrong.map((w) => (
              <li key={w.id} className="rounded-2xl border border-bad/30 bg-card p-3.5">
                <div className="text-[15px] font-semibold leading-snug">{w.title}</div>
                <div className="mt-1.5 text-sm text-good"><span className="font-bold">Richtig: </span>{w.answer}</div>
                {w.explanation && <p className="mt-1 text-sm text-mute">{w.explanation}</p>}
                {w.law && <span className="mt-1.5 inline-block rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-400">{w.law}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        {data.wrong.length > 0 && (
          <Button variant="theme" className="flex-1" onClick={onPractice}>Fehler üben ({data.wrong.length})</Button>
        )}
        <Button className="flex-1" onClick={onAgain}><Icon name="reset" size={18} /> Nochmal versuchen</Button>
        <Button variant="secondary" className="flex-1" onClick={onBack}>Zurück</Button>
      </div>
    </div>
  );
}
