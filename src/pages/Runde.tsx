import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usePruefung } from '@/app/pruefungContext';
import { getMode } from '@/modes/registry';
import type { GameMode, ModeResult, PlayItem } from '@/modes/types';
import { buildSession } from '@/engine/session';
import type { Session } from '@/engine/session';
import { dayString } from '@/engine/dates';
import { describeCard, describeItem } from '@/engine/describe';
import { initialScore, scoreAnswer, starsFor } from '@/engine/scoring';
import type { AnswerReport, ScoreState } from '@/engine/scoring';
import { finishRound, recordAnswerFor } from '@/engine/rounds';
import type { RoundOutcome } from '@/engine/rounds';
import { getFortschritt } from '@/store/progress';
import { RoundResult } from '@/ui/RoundResult';
import type { ResultData, WrongEntry } from '@/ui/RoundResult';
import { playSound } from '@/ui/sound';
import { Button } from '@/ui/Button';
import { NotFound } from './NotFound';

interface Answered {
  itemId: string;
  correct: boolean;
}

function Loading() {
  return <div className="grid min-h-dvh place-items-center text-mute">Lädt …</div>;
}

function Runner({
  mode,
  chapterKey,
  itemIds,
  onAgain,
  onPractice,
}: {
  mode: GameMode;
  chapterKey: string;
  itemIds?: string[];
  onAgain: () => void;
  onPractice: (ids: string[]) => void;
}) {
  const pr = usePruefung();
  const navigate = useNavigate();
  const pid = pr.meta.id;
  const [session] = useState<Session>(() =>
    buildSession(pr, mode, getFortschritt(pid), { chapterIds: chapterKey === 'alle' ? undefined : [chapterKey], itemIds }, dayString()),
  );
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<ResultData | null>(null);
  const scoreRef = useRef<ScoreState>(initialScore());
  const answers = useRef<Answered[]>([]);
  const tally = useRef({ correct: 0, total: 0 });
  const finished = useRef(false);

  const back = useCallback(
    () => navigate(chapterKey === 'alle' ? `/p/${pid}/modi` : `/p/${pid}/modi?kapitel=${chapterKey}`),
    [navigate, pid, chapterKey],
  );

  const onAnswer = useCallback(
    (r: AnswerReport) => {
      const { result: res, next } = scoreAnswer(scoreRef.current, r);
      scoreRef.current = next;
      setScore(next.total);
      answers.current.push({ itemId: r.itemId, correct: r.correct });
      // mehrteilige Aufgaben zählen je Teil, sonst je Aufgabe
      tally.current.correct += r.parts ? r.parts.correct : r.correct ? 1 : 0;
      tally.current.total += r.parts ? r.parts.total : 1;
      recordAnswerFor(pid, r);
      return res;
    },
    [pid],
  );

  const wrongEntries = useMemo(() => {
    const byId = new Map<string, WrongEntry>();
    const items = new Map<string, PlayItem>(session.items.map((i) => [i.id, i]));
    const cards = new Map(session.flashcards.map((f) => [f.id, f]));
    return (ids: string[]): WrongEntry[] =>
      ids.flatMap((id) => {
        if (byId.has(id)) return [byId.get(id)!];
        const it = items.get(id);
        const fc = cards.get(id);
        const d = it ? describeItem(it) : fc ? describeCard(fc) : null;
        if (!d) return [];
        const e: WrongEntry = { id, ...d, explanation: it?.explanation, law: it?.law };
        byId.set(id, e);
        return [e];
      });
  }, [session]);

  const onFinish = useCallback(
    (s: ModeResult) => {
      if (finished.current) return;
      finished.current = true;
      const total = scoreRef.current.total;
      const outcome: RoundOutcome = finishRound(pid, mode.id, chapterKey, { ...s, score: total });
      // pro Aufgabe zählt die letzte Antwort
      const last = new Map<string, boolean>();
      answers.current.forEach((a) => last.set(a.itemId, a.correct));
      const wrongIds = [...last.entries()].filter(([, ok]) => !ok).map(([id]) => id);
      const correct = tally.current.correct;
      const totalCount = tally.current.total;
      playSound('win');
      setResult({
        score: total,
        correct,
        total: totalCount,
        stars: starsFor(correct, totalCount),
        outcome,
        wrong: wrongEntries(wrongIds),
        statText: s.stat?.label,
      });
    },
    [pid, mode.id, chapterKey, wrongEntries],
  );

  /** × während der Runde: bisher erspielte XP bleiben erhalten */
  const onClose = useCallback(() => {
    if (!finished.current) {
      finished.current = true;
      if (scoreRef.current.total > 0) finishRound(pid, mode.id, chapterKey, { score: scoreRef.current.total, maxScore: 0 }, false);
    }
    back();
  }, [pid, mode.id, chapterKey, back]);

  if (result) {
    return (
      <RoundResult
        data={result}
        onAgain={onAgain}
        onPracticeWrong={() => onPractice(result.wrong.map((w) => w.id))}
        onBack={back}
      />
    );
  }

  const empty = session.items.length === 0 && session.flashcards.length === 0 && !session.charts;
  if (empty) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <h1 className="text-2xl">Dafür gibt es hier noch keine Aufgaben.</h1>
          <p className="mt-2 text-mute">Wähle ein anderes Kapitel oder einen anderen Modus.</p>
          <Button className="mt-5" onClick={back}>Zurück</Button>
        </div>
      </div>
    );
  }

  const Game = mode.Component;
  return (
    <Suspense fallback={<Loading />}>
      <Game
        pruefung={pr.meta}
        items={session.items}
        flashcards={session.flashcards}
        charts={session.charts}
        score={score}
        onAnswer={onAnswer}
        onFinish={onFinish}
        onClose={onClose}
      />
    </Suspense>
  );
}

/** Route /p/:pruefungId/spiel/:modusId?kapitel=k2 – eine Runde in einem Spielmodus */
export function Runde() {
  const pr = usePruefung();
  const { modusId } = useParams();
  const [sp] = useSearchParams();
  const location = useLocation();
  const mode = getMode(modusId);
  const kap = sp.get('kapitel') ?? 'alle';
  const chapterKey = pr.chapters.some((c) => c.id === kap) ? kap : 'alle';
  const [attempt, setAttempt] = useState(0);
  const [practice, setPractice] = useState<string[] | undefined>((location.state as { itemIds?: string[] } | null)?.itemIds);

  if (!mode) return <NotFound what="Dieser Spielmodus" />;
  return (
    <Runner
      key={`${mode.id}-${chapterKey}-${attempt}-${practice?.join(',') ?? ''}`}
      mode={mode}
      chapterKey={chapterKey}
      itemIds={practice}
      onAgain={() => {
        setPractice(undefined);
        setAttempt((a) => a + 1);
      }}
      onPractice={(ids) => {
        setPractice(ids);
        setAttempt((a) => a + 1);
      }}
    />
  );
}
