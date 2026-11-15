import { useMemo, useRef, useState } from 'react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { isChoiceItem, toChallenge } from '@/engine/choices';
import { itemText } from '@/engine/describe';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { ChapterChip } from '@/ui/ChapterChip';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';
import { GameEnd } from '@/ui/game/GameEnd';
import { ChoiceList } from '@/ui/game/ChoiceList';
import { useGestures } from '@/ui/game/useGestures';
import { useScene3D } from '@/ui/game3d/useScene3D';
import { NoWebGL } from '@/ui/game3d/NoWebGL';
import { goalsToWin, keeperZone } from './logic';
import { PenaltyScene } from './scene';

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const qs = useMemo(() => items.filter(isChoiceItem).map((i) => toChallenge(i, 4)), [items]);
  const [idx, setIdx] = useState(0);
  const [goals, setGoals] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [shown, setShown] = useState(false); // Animation fertig → Rückmeldung
  const [end, setEnd] = useState(false);
  const start = useRef(Date.now());
  const totalRef = useRef(score);
  const q = qs[idx];

  const { host, scene, unsupported } = useScene3D(
    (el, w, h) => {
      const s = new PenaltyScene(el, w, h);
      s.reset(q.choices.length);
      return s;
    },
    (s, dt) => s.update(dt),
    !end,
  );

  const shoot = (i: number) => {
    if (picked !== null || i < 0 || i >= q.choices.length) return;
    const ok = i === q.correct;
    const r = onAnswer({ itemId: q.item.id, correct: ok, timeMs: Date.now() - start.current });
    totalRef.current = r.total;
    if (ok) setGoals((g) => g + 1);
    setPicked(i);
    setRes(r);
    const finish = () => {
      playSound(ok ? 'correct' : 'wrong');
      setShown(true);
    };
    const s = scene.current;
    if (s) s.shoot(i, q.choices.length, ok, keeperZone(q.choices.length, i, ok), finish);
    else finish();
  };

  const gestures = useGestures(1, 1, (x, y) => shoot(scene.current?.pick(x, y) ?? -1));
  useKeys((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= q.choices.length) shoot(n - 1);
  }, picked === null && !end && !unsupported);

  const last = idx + 1 >= qs.length;
  const next = () => {
    if (last) {
      setEnd(true);
      return;
    }
    scene.current?.reset(qs[idx + 1].choices.length);
    setPicked(null);
    setRes(null);
    setShown(false);
    setIdx(idx + 1);
    start.current = Date.now();
  };

  if (end) {
    const win = goals >= goalsToWin(qs.length);
    return (
      <GameEnd
        win={win}
        icon="trophy"
        title={win ? 'Torjäger!' : 'Knapp daneben'}
        text={`${goals} von ${qs.length} Elfmetern verwandelt${win ? '' : ' – für den Sieg brauchst du ' + goalsToWin(qs.length) + '.'}`}
        onDone={() => onFinish({ score: totalRef.current, maxScore: qs.length * 150 })}
      />
    );
  }
  if (unsupported) return <NoWebGL title="Elfmeter 3D" total={qs.length} score={score} onClose={onClose} />;

  const correct = picked !== null && picked === q.correct;
  return (
    <ModeFrame padBottom={shown}>
      <ModeHeader
        onClose={onClose}
        current={idx + (picked !== null ? 1 : 0)}
        total={qs.length}
        score={score}
        title="Elfmeter"
        lookup={shown ? itemText(q.item) : undefined}
        right={<span className="rounded-full bg-card-hi px-2 py-0.5 text-xs font-bold text-good" data-testid="goals" aria-label={`${goals} Tore`}>⚽ {goals}</span>}
      />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={q.item.chapter} />
        <h1 className="mt-2 font-display text-[21px] leading-snug lg:text-3xl" data-testid="question">
          {q.item.type === 'truefalse' && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
          {q.question}
        </h1>
        <div className="mx-auto mt-3 max-w-[480px]">
          <div ref={host} className="aspect-[5/4] w-full touch-none select-none overflow-hidden rounded-3xl border border-line bg-[#0B1630]" role="img" aria-label="Elfmeter: Tor mit Antwort-Feldern" data-testid="pitch" {...gestures} />
          <p className="mt-2 text-center text-xs text-mute">Tippe ein Feld im Tor an – oder wähle unten die Antwort (PC: 1–{q.choices.length}).</p>
        </div>
        <div className="mt-3">
          <ChoiceList choices={q.choices} onPick={shoot} picked={picked} correct={q.correct} disabled={picked !== null} />
        </div>
      </div>
      {shown && res && (
        <FeedbackSheet
          correct={correct}
          title={correct ? 'TOOOR!' : 'Gehalten!'}
          points={res.points}
          text={q.item.explanation ?? (correct ? undefined : `Richtig wäre: ${q.choices[q.correct]}`)}
          law={q.item.law}
          nextLabel={last ? 'Weiter' : 'Nächster Elfmeter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
