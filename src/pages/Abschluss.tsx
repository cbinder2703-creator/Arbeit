import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePruefung } from '@/app/pruefungContext';
import { PruefungsShell } from '@/app/PruefungsShell';
import { useFortschritt, getFortschritt } from '@/store/progress';
import { examStatus } from '@/engine/stats';
import { fractionOf, pickExamItems, scoreExam } from '@/engine/exam';
import type { ExamPick, ExamScore } from '@/engine/exam';
import { prepareItem } from '@/engine/session';
import { describeItem } from '@/engine/describe';
import { finishRound, recordAnswerFor } from '@/engine/rounds';
import type { RoundOutcome } from '@/engine/rounds';
import { initialScore, scoreAnswer, starsFor } from '@/engine/scoring';
import type { AnswerReport, ScoreState } from '@/engine/scoring';
import { awardBadges } from '@/engine/badges';
import { useProgress } from '@/store/progress';
import { GRADE_LABEL } from '@/engine/grades';
import type { PlayItem } from '@/modes/types';
import { ItemSequence, modeForType } from '@/ui/ItemSequence';
import { ExamResult } from '@/ui/ExamResult';
import type { ExamResultData } from '@/ui/ExamResult';
import { RoundResult } from '@/ui/RoundResult';
import type { ResultData, WrongEntry } from '@/ui/RoundResult';
import { ProgressRing } from '@/ui/ProgressRing';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { playSound } from '@/ui/sound';

type Phase =
  | { kind: 'intro' }
  | { kind: 'exam'; picks: ExamPick[]; items: PlayItem[]; run: number }
  | { kind: 'examResult'; data: ExamResultData; picks: ExamPick[]; score: ExamScore }
  | { kind: 'practice'; items: PlayItem[]; run: number }
  | { kind: 'practiceResult'; data: ResultData };

const KEY: [string, string][] = [['100–92 %', '1'], ['91–81 %', '2'], ['80–67 %', '3'], ['66–50 %', '4'], ['49–30 %', '5'], ['29–0 %', '6']];

/** Route /p/:pruefungId/abschluss – der Endgegner dieser Prüfung */
export function Abschluss() {
  const pr = usePruefung();
  const { meta } = pr;
  const pid = meta.id;
  const navigate = useNavigate();
  const fort = useFortschritt(pid);
  const status = examStatus(pr, fort);
  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });

  const fractions = useRef<Record<string, number>>({});
  const practiceScore = useRef<ScoreState>(initialScore());
  const practiceTally = useRef({ correct: 0, total: 0, wrong: new Set<string>() });
  const [liveScore, setLiveScore] = useState(0);
  const finished = useRef(false);

  const start = () => {
    const picks = pickExamItems(pr, meta.finalExam.questions).filter((x) => modeForType(x.item.type));
    fractions.current = {};
    finished.current = false;
    const items = picks.map((x) => prepareItem(x.item, x.chapter, Math.random));
    setPhase((p) => ({ kind: 'exam', picks, items, run: (p.kind === 'exam' ? p.run : 0) + 1 }));
  };

  const startPractice = (ids: string[]) => {
    const all = pr.chapters.flatMap((c) => c.items.map((i) => ({ i, c })));
    const items = ids.flatMap((id) => {
      const f = all.find((x) => x.i.id === id);
      return f ? [prepareItem(f.i, f.c, Math.random)] : [];
    });
    practiceScore.current = initialScore();
    practiceTally.current = { correct: 0, total: 0, wrong: new Set() };
    setLiveScore(0);
    finished.current = false;
    setPhase((p) => ({ kind: 'practice', items, run: (p.kind === 'practice' ? p.run : 0) + 1 }));
  };

  const onExamAnswer = useCallback(
    (r: AnswerReport) => {
      fractions.current[r.itemId] = fractionOf(r);
      recordAnswerFor(pid, r);
      return { points: 0, bonus: 0, multiplier: 1, combo: 0, total: 0 };
    },
    [pid],
  );

  const onExamDone = useCallback(
    (picks: ExamPick[]) => {
      if (finished.current) return;
      finished.current = true;
      const score = scoreExam(picks, fractions.current);
      const prevBest = getFortschritt(pid).bestGrade;
      useProgress.getState().recordExam(pid, score.percent, score.grade);
      const outcome: RoundOutcome = finishRound(pid, 'abschluss', 'alle', { score: score.points, maxScore: picks.length * 100 });
      const badges = awardBadges(pr).map((b) => ({ id: b.id, title: b.title }));
      const byId = new Map(picks.map((x) => [x.item.id, x.item]));
      const wrong: WrongEntry[] = score.wrongIds.flatMap((id) => {
        const it = byId.get(id);
        return it ? [{ id, ...describeItem(it), explanation: it.explanation, law: it.law }] : [];
      });
      playSound(score.passed ? 'win' : 'wrong');
      setPhase({ kind: 'examResult', picks, score, data: { score, total: picks.length, outcome, wrong, badges, isBest: prevBest === null || score.grade < prevBest } });
    },
    [pid, pr],
  );

  const onPracticeAnswer = useCallback(
    (r: AnswerReport) => {
      const { result, next } = scoreAnswer(practiceScore.current, r);
      practiceScore.current = next;
      setLiveScore(next.total);
      recordAnswerFor(pid, r);
      practiceTally.current.correct += r.parts ? r.parts.correct : r.correct ? 1 : 0;
      practiceTally.current.total += r.parts ? r.parts.total : 1;
      if (!r.correct) practiceTally.current.wrong.add(r.itemId);
      return result;
    },
    [pid],
  );

  const onPracticeDone = useCallback(
    (items: PlayItem[]) => {
      if (finished.current) return;
      finished.current = true;
      const total = practiceScore.current.total;
      const outcome = finishRound(pid, 'abschluss-ueben', 'alle', { score: total, maxScore: items.length * 100 });
      const t = practiceTally.current;
      const badges = awardBadges(pr).map((b) => ({ id: b.id, title: b.title }));
      const wrong: WrongEntry[] = items.filter((i) => t.wrong.has(i.id)).map((i) => ({ id: i.id, ...describeItem(i), explanation: i.explanation, law: i.law }));
      playSound('win');
      setPhase({ kind: 'practiceResult', data: { score: total, correct: t.correct, total: t.total, stars: starsFor(t.correct, t.total), outcome, wrong, badges, title: 'Geübt!' } });
    },
    [pid, pr],
  );

  const leave = () => setPhase({ kind: 'intro' });
  // × während der Prüfung: nicht gewertet (bereits gegebene Antworten bleiben im Lernplan)
  const close = leave;

  if (phase.kind === 'exam') {
    return (
      <ItemSequence
        key={phase.run}
        items={phase.items}
        exam
        score={0}
        onAnswer={onExamAnswer}
        onDone={() => onExamDone(phase.picks)}
        onClose={close}
      />
    );
  }
  if (phase.kind === 'examResult') {
    return (
      <ExamResult
        data={phase.data}
        onAgain={start}
        onPractice={() => startPractice(phase.score.wrongIds)}
        onBack={leave}
      />
    );
  }
  if (phase.kind === 'practice') {
    return (
      <ItemSequence
        key={phase.run}
        items={phase.items}
        exam={false}
        score={liveScore}
        onAnswer={onPracticeAnswer}
        onDone={() => onPracticeDone(phase.items)}
        onClose={close}
      />
    );
  }
  if (phase.kind === 'practiceResult') {
    return (
      <RoundResult
        data={phase.data}
        onAgain={start}
        onPracticeWrong={phase.data.wrong.length ? () => startPractice(phase.data.wrong.map((w) => w.id)) : undefined}
        onBack={leave}
        backLabel="Zur Abschlussprüfung"
      />
    );
  }

  return (
    <PruefungsShell>
      <div className="mx-auto max-w-3xl px-4 pt-5 lg:px-10 lg:pt-10">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-xp/15 text-xp">
            <Icon name="crown" size={30} />
          </span>
          <div>
            <h1 className="text-3xl">{meta.finalExam.title}</h1>
            <p className="text-mute">Der Endgegner von {meta.gameTitle}</p>
          </div>
        </div>

        <section className={`mt-5 rounded-2xl border-2 p-4 ${status.unlocked ? 'border-good bg-good/10' : 'border-xp/60 bg-xp/10'}`} aria-label="Status">
          <div className="flex items-center gap-4">
            <ProgressRing percent={Math.min(100, Math.round((status.percent / Math.max(1, status.need)) * 100))} size={64} color={status.unlocked ? '#22C55E' : '#FACC15'} label={`${status.percent}%`} />
            <div className="min-w-0">
              <div className="font-display text-lg">
                {status.unlocked ? 'Freigeschaltet – bereit für den Endgegner!' : `Frei ab ${status.need} % – du hast ${status.percent} %`}
              </div>
              <p className="text-sm text-mute">
                {status.unlocked
                  ? `${meta.finalExam.questions} Aufgaben aus allen Kapiteln.`
                  : `Beantworte mindestens ${status.need} % aller Aufgaben einmal richtig, dann geht’s los.`}
              </p>
            </div>
          </div>
        </section>

        <ul className="mt-5 space-y-2 text-[15px]">
          <li className="flex gap-2"><Icon name="eye" className="mt-0.5 shrink-0 text-mute" size={18} /> Kein Feedback zwischendurch – erst am Ende siehst du alles.</li>
          <li className="flex gap-2"><Icon name="target" className="mt-0.5 shrink-0 text-mute" size={18} /> Gemischt aus allen Aufgabentypen und Kapiteln.</li>
          <li className="flex gap-2"><Icon name="medal" className="mt-0.5 shrink-0 text-mute" size={18} /> Note nach IHK-Schlüssel. Die beste Note steht auf deiner Prüfungs-Kachel.</li>
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-card p-4">
          <div>
            <div className="text-xs text-mute">Beste Note</div>
            <div className="font-display text-3xl">{fort.bestGrade ?? '–'}</div>
            {fort.bestGrade && <div className="text-xs text-mute">{GRADE_LABEL[fort.bestGrade]}</div>}
          </div>
          <div>
            <div className="text-xs text-mute">Versuche</div>
            <div className="font-display text-3xl">{fort.examAttempts}</div>
          </div>
        </div>

        <Button variant="primary" block className="mt-6" disabled={!status.unlocked} onClick={start}>
          <Icon name={status.unlocked ? 'play' : 'lock'} size={18} /> {status.unlocked ? 'Abschlussprüfung starten' : 'Noch gesperrt'}
        </Button>
        {!status.unlocked && (
          <Button variant="secondary" block className="mt-3" onClick={() => navigate(`/p/${pid}/modi`)}>
            Weiter üben
          </Button>
        )}

        <details className="mt-6 rounded-2xl bg-card p-4">
          <summary className="tap cursor-pointer font-semibold">Notenschlüssel (IHK)</summary>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {KEY.map(([range, g]) => (
                <tr key={g} className="border-t border-line">
                  <td className="py-1.5 text-mute">{range}</td>
                  <td className="py-1.5 text-right font-bold">Note {g} – {GRADE_LABEL[Number(g)]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </PruefungsShell>
  );
}
