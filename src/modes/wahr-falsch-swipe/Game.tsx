import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { PanInfo } from 'framer-motion';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { useSettings } from '@/store/settings';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { useFinishLabel } from '@/ui/sequence';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { TimerRing } from '@/ui/TimerRing';
import { ChapterChip } from '@/ui/ChapterChip';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';

const BLITZ_MS = 60_000;
const THRESHOLD = 110;

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const finishLabel = useFinishLabel();
  const blitz = useSettings((s) => s.blitz);
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [said, setSaid] = useState<boolean | null>(null);
  const [combo, setCombo] = useState(0);
  const [remaining, setRemaining] = useState(BLITZ_MS);
  const locked = useRef(false);
  const startAt = useRef(Date.now());
  const roundStart = useRef(Date.now());
  const finished = useRef(false);
  const latestScore = useRef(score);
  latestScore.current = res?.total ?? score;

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-14, 0, 14]);
  const greenOpacity = useTransform(x, [0, THRESHOLD * 1.4], [0, 0.55]);
  const redOpacity = useTransform(x, [-THRESHOLD * 1.4, 0], [0.55, 0]);

  const item = items[idx];
  const statement = item.type === 'truefalse' ? item.statement : '';
  const truth = item.type === 'truefalse' ? item.correct : false;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish({ score: latestScore.current, maxScore: items.length * 100 });
  }, [onFinish, items.length]);

  const decide = useCallback(
    (sayTrue: boolean) => {
      if (locked.current || finished.current) return;
      locked.current = true;
      const correct = sayTrue === truth;
      const r = onAnswer({ itemId: item.id, correct, timeMs: Date.now() - startAt.current });
      playSound(correct ? 'correct' : 'wrong');
      setRes(r);
      setSaid(sayTrue);
      setCombo(r.combo);
      latestScore.current = r.total;
      if (!reduce) void animate(x, sayTrue ? 40 : -40, { duration: 0.15 });
    },
    [truth, onAnswer, item.id, reduce, x],
  );

  const next = useCallback(() => {
    if (idx + 1 >= items.length) return finish();
    x.set(0);
    locked.current = false;
    startAt.current = Date.now();
    setIdx((i) => i + 1);
    setRes(null);
    setSaid(null);
  }, [idx, items.length, finish, x]);

  // Blitz-Modus: 60 Sekunden gesamt, kurzes Aufblitzen statt Feedback-Sheet
  useEffect(() => {
    if (!blitz) return;
    roundStart.current = Date.now();
    const t = setInterval(() => {
      const left = BLITZ_MS - (Date.now() - roundStart.current);
      setRemaining(Math.max(0, left));
      if (left <= 0) {
        clearInterval(t);
        finish();
      }
    }, 200);
    return () => clearInterval(t);
  }, [blitz, finish]);

  useEffect(() => {
    if (!blitz || res === null) return;
    const t = setTimeout(next, 650);
    return () => clearTimeout(t);
  }, [blitz, res, next]);

  useKeys((e) => {
    if (e.key === 'ArrowRight') decide(true);
    if (e.key === 'ArrowLeft') decide(false);
  }, res === null);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > THRESHOLD || info.velocity.x > 700) decide(true);
    else if (info.offset.x < -THRESHOLD || info.velocity.x < -700) decide(false);
  };

  const correct = res !== null && said === truth;
  const showSheet = res !== null && !blitz;
  const upcoming = items[idx + 1];

  return (
    <ModeFrame padBottom={showSheet}>
      <ModeHeader
        onClose={onClose}
        current={idx + (res ? 1 : 0)}
        total={items.length}
        score={score}
        lookup={blitz ? undefined : itemText(item)}
        right={blitz ? <TimerRing remainingMs={remaining} totalMs={BLITZ_MS} size={40} /> : undefined}
      />
      <div className="flex flex-1 flex-col px-4 pb-6">
        <div className="flex items-center justify-between gap-2">
          <ChapterChip chapter={item.chapter} />
          {combo >= 3 && (
            <Chip color="#FACC15">
              <Icon name="flame" size={12} /> ×1,5 Combo
            </Chip>
          )}
        </div>

        <div className="relative mx-auto mt-5 flex w-full max-w-md flex-1 items-center justify-center" style={{ minHeight: 280 }}>
          {upcoming && (
            <div
              aria-hidden="true"
              className="absolute inset-x-3 top-1/2 h-[260px] -translate-y-1/2 scale-[0.95] rounded-3xl border border-line bg-card-hi/70"
            />
          )}
          <motion.div
            key={item.id}
            drag={res === null ? 'x' : false}
            dragSnapToOrigin
            dragElastic={0.9}
            onDragEnd={onDragEnd}
            style={{ x, rotate, touchAction: 'pan-y' }}
            initial={reduce ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            data-testid="swipe-card"
            className={`no-select relative z-10 flex h-[260px] w-full cursor-grab select-none flex-col items-center justify-center overflow-hidden rounded-3xl border-2 bg-card p-6 text-center shadow-xl shadow-black/40 active:cursor-grabbing ${
              res === null ? 'border-line' : correct ? 'border-good' : 'border-bad'
            }`}
          >
            <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-good" style={{ opacity: greenOpacity }} />
            <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-bad" style={{ opacity: redOpacity }} />
            <span className="relative text-sm font-semibold text-mute">Wahr oder falsch?</span>
            <p className="relative mt-3 font-display text-[22px] leading-snug" data-testid="statement">{statement}</p>
            {res !== null && (
              <span
                className={`absolute right-3 top-3 rounded-lg border-2 px-2 py-0.5 font-display text-sm uppercase tracking-wider ${correct ? 'border-good text-good' : 'border-bad text-bad'}`}
              >
                {truth ? 'Wahr' : 'Falsch'}
              </span>
            )}
          </motion.div>
        </div>

        <div className="mx-auto mt-5 grid w-full max-w-md grid-cols-2 gap-3">
          <button
            onClick={() => decide(false)}
            disabled={res !== null}
            className="tap flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-bad/60 bg-bad/10 font-bold text-bad transition active:scale-[0.97] disabled:opacity-40"
          >
            <ArrowLeft size={20} /> Falsch
          </button>
          <button
            onClick={() => decide(true)}
            disabled={res !== null}
            className="tap flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-good/60 bg-good/10 font-bold text-good transition active:scale-[0.97] disabled:opacity-40"
          >
            Wahr <ArrowRight size={20} />
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-mute">Wische nach rechts (wahr) oder links (falsch) · am PC mit ← und →</p>
      </div>

      {showSheet && res && (
        <FeedbackSheet
          correct={correct}
          points={res.points}
          text={item.explanation ?? `Die Aussage ist ${truth ? 'wahr' : 'falsch'}.`}
          law={item.law}
          nextLabel={idx + 1 >= items.length ? finishLabel : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
