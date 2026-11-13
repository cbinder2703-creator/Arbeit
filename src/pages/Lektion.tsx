import { useCallback, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { usePruefung } from '@/app/pruefungContext';
import { NotFound } from './NotFound';
import { getFortschritt, useFortschritt, useProgress } from '@/store/progress';
import { nextLesson, pathLessons } from '@/engine/path';
import type { PathLesson } from '@/engine/path';
import { prepareItem } from '@/engine/session';
import { describeItem } from '@/engine/describe';
import { initialScore, scoreAnswer, starsFor } from '@/engine/scoring';
import type { AnswerReport, ScoreState } from '@/engine/scoring';
import { finishRound, recordAnswerFor } from '@/engine/rounds';
import { awardBadges } from '@/engine/badges';
import type { PlayItem } from '@/modes/types';
import { ItemSequence } from '@/ui/ItemSequence';
import { RoundResult } from '@/ui/RoundResult';
import type { ResultData, WrongEntry } from '@/ui/RoundResult';
import { SpeakButton } from '@/ui/SpeakButton';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { ModeFrame } from '@/ui/ModeFrame';
import { playSound } from '@/ui/sound';

type Phase = 'grammar' | 'run' | 'retry-intro' | 'result';

function GrammarIntro({ pl, onStart, onBack }: { pl: PathLesson; onStart: () => void; onBack: () => void }) {
  const g = pl.lesson.grammar!;
  return (
    <ModeFrame>
      <div className="flex-1 px-4 pb-8 pt-[calc(var(--safe-top)+0.75rem)]">
        <button onClick={onBack} aria-label="Zurück zum Lernpfad" className="tap -ml-2 grid place-items-center rounded-xl text-mute hover:text-ink">
          <Icon name="x" size={24} />
        </button>
        <p className="mt-2 text-xs font-bold tracking-widest" style={{ color: pl.chapter.color }}>
          LEKTION {pl.index + 1} · {pl.lesson.title.toUpperCase()}
        </p>
        <h1 className="mt-1 text-3xl leading-tight">{g.title}</h1>
        <div className="mt-4 rounded-3xl bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-xp">
            <Icon name="lightbulb" size={18} /> Kurz erklärt
          </div>
          <p className="whitespace-pre-line text-[16px] leading-relaxed">{g.text}</p>
        </div>
        {g.examples.length > 0 && (
          <ul className="mt-4 space-y-2" aria-label="Beispiele">
            {g.examples.map((ex, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl border-l-4 bg-card p-3.5" style={{ borderColor: pl.chapter.color }}>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[17px] leading-snug">{ex.en}</div>
                  <div className="text-sm text-mute">{ex.de}</div>
                </div>
                <SpeakButton text={ex.en} label={`„${ex.en}“ vorlesen`} />
              </li>
            ))}
          </ul>
        )}
        <Button variant="confirm" block className="mt-7" onClick={onStart}>
          Los geht’s <Icon name="chevron-right" size={18} />
        </Button>
      </div>
    </ModeFrame>
  );
}

function Runner({ pl }: { pl: PathLesson }) {
  const pr = usePruefung();
  const pid = pr.meta.id;
  const navigate = useNavigate();
  const toPath = useCallback(() => navigate(`/p/${pid}/pfad`), [navigate, pid]);
  const lessonItems = pl.lesson.items.flatMap((id) => {
    const it = pl.chapter.items.find((i) => i.id === id);
    return it ? [it] : [];
  });

  const [phase, setPhase] = useState<Phase>(pl.lesson.grammar ? 'grammar' : 'run');
  const [items, setItems] = useState<PlayItem[]>(() => lessonItems.map((it) => prepareItem(it, pl.chapter, Math.random)));
  const [run, setRun] = useState(1);
  const [retry, setRetry] = useState(false);
  const [liveScore, setLiveScore] = useState(0);
  const [result, setResult] = useState<ResultData | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const scoreRef = useRef<ScoreState>(initialScore());
  const tally = useRef({ correct: 0, total: 0, wrong: new Set<string>() });
  const retryRef = useRef(false);
  const finished = useRef(false);

  const onAnswer = useCallback(
    (r: AnswerReport) => {
      const { result: res, next } = scoreAnswer(scoreRef.current, r);
      scoreRef.current = next;
      setLiveScore(next.total);
      if (!retryRef.current) {
        // nur die erste Runde zählt für Lernplan und Sterne; die Wiederholung bringt Punkte
        recordAnswerFor(pid, r);
        tally.current.correct += r.parts ? r.parts.correct : r.correct ? 1 : 0;
        tally.current.total += r.parts ? r.parts.total : 1;
        if (!r.correct) tally.current.wrong.add(r.itemId);
      }
      return res;
    },
    [pid],
  );

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const t = tally.current;
    const stars = Math.max(1, starsFor(t.correct, t.total));
    const percent = t.total ? Math.round((t.correct / t.total) * 100) : 100;
    useProgress.getState().recordLesson(pid, pl.lesson.id, stars, percent);
    const outcome = finishRound(pid, 'lektion', pl.lesson.id, { score: scoreRef.current.total, maxScore: lessonItems.length * 100 });
    const badges = awardBadges(pr).map((b) => ({ id: b.id, title: b.title }));
    const wrong: WrongEntry[] = lessonItems.filter((i) => t.wrong.has(i.id)).map((i) => ({ id: i.id, ...describeItem(i), explanation: i.explanation, law: i.law }));
    const after = pathLessons(pr, getFortschritt(pid));
    setNextId(after.find((l) => l.index > pl.index && l.unlocked)?.lesson.id ?? nextLesson(pr, getFortschritt(pid))?.lesson.id ?? null);
    playSound('win');
    setResult({ score: scoreRef.current.total, correct: t.correct, total: t.total, stars, outcome, wrong, badges, title: 'Lektion geschafft!' });
    setPhase('result');
  }, [pid, pr, pl, lessonItems]);

  const onDone = () => {
    const wrongIds = [...tally.current.wrong];
    if (!retryRef.current && wrongIds.length > 0) {
      retryRef.current = true;
      setRetry(true);
      setItems(wrongIds.flatMap((id) => lessonItems.filter((i) => i.id === id)).map((it) => prepareItem(it, pl.chapter, Math.random)));
      setRun((r) => r + 1);
      setPhase('retry-intro');
    } else finish();
  };

  const again = () => {
    scoreRef.current = initialScore();
    tally.current = { correct: 0, total: 0, wrong: new Set() };
    retryRef.current = false;
    finished.current = false;
    setRetry(false);
    setLiveScore(0);
    setItems(lessonItems.map((it) => prepareItem(it, pl.chapter, Math.random)));
    setRun((r) => r + 1);
    setResult(null);
    setPhase('run');
  };

  if (phase === 'grammar') return <GrammarIntro pl={pl} onStart={() => setPhase('run')} onBack={toPath} />;

  if (phase === 'retry-intro') {
    return (
      <ModeFrame>
        <div className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-p/20 text-p-accent">
              <Icon name="reset" size={30} />
            </span>
            <h1 className="mt-4 text-3xl">Noch einmal!</h1>
            <p className="mt-2 text-mute">
              {items.length} {items.length === 1 ? 'Aufgabe hat' : 'Aufgaben haben'} noch nicht geklappt. Gleich nochmal – dann sitzt es.
            </p>
            <Button className="mt-6" onClick={() => setPhase('run')}>Los</Button>
          </div>
        </div>
      </ModeFrame>
    );
  }

  if (phase === 'result' && result) {
    return (
      <RoundResult
        data={result}
        onAgain={again}
        onNext={() => navigate(nextId ? `/p/${pid}/lektion/${nextId}` : `/p/${pid}/pfad`)}
        nextLabel={nextId ? 'Nächste Lektion' : 'Zum Lernpfad'}
        onBack={toPath}
        backLabel="Zum Lernpfad"
      />
    );
  }

  return (
    <ItemSequence
      key={run}
      items={items}
      exam={false}
      score={liveScore}
      lastLabel={retry ? 'Lektion beenden' : 'Weiter'}
      onAnswer={onAnswer}
      onDone={onDone}
      onClose={toPath}
    />
  );
}

/** Route /p/:pruefungId/lektion/:lessonId – eine Lektion des Lernpfads */
export function Lektion() {
  const pr = usePruefung();
  const { lessonId } = useParams();
  const fort = useFortschritt(pr.meta.id);
  const pl = pathLessons(pr, fort).find((l) => l.lesson.id === lessonId);
  if (!pl) return <NotFound what="Diese Lektion" />;
  if (!pl.unlocked) return <Navigate to={`/p/${pr.meta.id}/pfad`} replace />;
  return <Runner key={pl.lesson.id} pl={pl} />;
}
