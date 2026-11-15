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
import { Hearts } from '@/ui/game/Hearts';
import { GameEnd } from '@/ui/game/GameEnd';
import { ChoiceList } from '@/ui/game/ChoiceList';
import { useScene3D } from '@/ui/game3d/useScene3D';
import { NoWebGL } from '@/ui/game3d/NoWebGL';
import { TowerScene } from './scene';

export const LIVES = 3;

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const qs = useMemo(() => items.filter(isChoiceItem).map((i) => toChallenge(i, 4)), [items]);
  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [height, setHeight] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [shown, setShown] = useState(false);
  const [end, setEnd] = useState(false);
  const start = useRef(Date.now());
  const totalRef = useRef(score);
  const livesRef = useRef(LIVES);
  const heightRef = useRef(0);
  const q = qs[idx];

  const { host, scene, unsupported } = useScene3D(
    (el, w, h) => new TowerScene(el, w, h),
    (s, dt) => s.update(dt),
    !end,
  );

  const answer = (i: number) => {
    if (picked !== null || i < 0 || i >= q.choices.length) return;
    const ok = i === q.correct;
    const r = onAnswer({ itemId: q.item.id, correct: ok, timeMs: Date.now() - start.current });
    totalRef.current = r.total;
    if (ok) heightRef.current += 1;
    else {
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      heightRef.current = Math.max(0, heightRef.current - 1);
    }
    setHeight(heightRef.current);
    setPicked(i);
    setRes(r);
    const finish = () => {
      playSound(ok ? 'correct' : 'wrong');
      setShown(true);
    };
    const s = scene.current;
    if (!s) finish();
    else if (ok) s.addBlock(finish);
    else s.collapse(finish);
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= q.choices.length) answer(n - 1);
  }, picked === null && !end && !unsupported);

  const over = res !== null && (livesRef.current <= 0 || idx + 1 >= qs.length);
  const next = () => {
    if (over) {
      setEnd(true);
      return;
    }
    setPicked(null);
    setRes(null);
    setShown(false);
    setIdx(idx + 1);
    start.current = Date.now();
  };

  if (end) {
    const win = livesRef.current > 0;
    return (
      <GameEnd
        win={win}
        icon="layers"
        title={win ? 'Turm steht!' : 'Turm eingestürzt'}
        text={win ? `Dein Turm ist ${heightRef.current} Blöcke hoch – mit ${livesRef.current} ${livesRef.current === 1 ? 'Herz' : 'Herzen'} übrig.` : `Dein Turm war ${heightRef.current} Blöcke hoch. Nächster Versuch!`}
        onDone={() => onFinish({ score: totalRef.current, maxScore: qs.length * 150 })}
      />
    );
  }
  if (unsupported) return <NoWebGL title="Turmbau 3D" total={qs.length} score={score} onClose={onClose} />;

  const correct = picked !== null && picked === q.correct;
  return (
    <ModeFrame padBottom={shown}>
      <ModeHeader
        onClose={onClose}
        current={idx + (picked !== null ? 1 : 0)}
        total={qs.length}
        score={score}
        title="Turmbau"
        lookup={shown ? itemText(q.item) : undefined}
        right={
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-card-hi px-2 py-0.5 text-xs font-bold text-xp" data-testid="height" aria-label={`Turmhöhe ${height}`}>🧱 {height}</span>
            <Hearts lives={lives} max={LIVES} />
          </span>
        }
      />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={q.item.chapter} />
        <h1 className="mt-2 font-display text-[21px] leading-snug lg:text-3xl" data-testid="question">
          {q.item.type === 'truefalse' && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
          {q.question}
        </h1>
        <div className="mx-auto mt-3 max-w-[480px]">
          <div ref={host} className="aspect-[5/4] w-full select-none overflow-hidden rounded-3xl border border-line bg-[#7DD3FC]" role="img" aria-label={`Turm aus ${height} Blöcken`} data-testid="tower" />
        </div>
        <div className="mt-3">
          <ChoiceList choices={q.choices} onPick={answer} picked={picked} correct={q.correct} disabled={picked !== null} />
        </div>
      </div>
      {shown && res && (
        <FeedbackSheet
          correct={correct}
          title={correct ? 'Block sitzt! +1' : 'Der Turm wackelt!'}
          points={res.points}
          text={q.item.explanation ?? (correct ? undefined : `Richtig wäre: ${q.choices[q.correct]}`)}
          law={q.item.law}
          nextLabel={over ? 'Weiter' : 'Weiterbauen'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
