import { useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { isChoiceItem, toChallenge } from '@/engine/choices';
import { lanesFor, makeRound, moveLane, setLane, stepRound } from '@/engine/laneRun';
import type { Round } from '@/engine/laneRun';
import { itemText } from '@/engine/describe';
import { useSettings } from '@/store/settings';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { ChapterChip } from '@/ui/ChapterChip';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';
import { Stage } from '@/ui/game/Stage';
import { Hearts } from '@/ui/game/Hearts';
import { GameEnd } from '@/ui/game/GameEnd';
import { ChoiceList } from '@/ui/game/ChoiceList';
import { CHOICE_COLORS, LETTERS } from '@/ui/game/colors';
import { emoji, label } from '@/ui/game/draw';

const W = 360;
const H = 270;
const PX = 70; // Spieler-Position (x)
const PPM = 16; // Pixel pro Meter
export const LIVES = 3;

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const reduce = useReducedMotion();
  const relaxed = useSettings((s) => s.relaxed) || !!reduce;
  const qs = useMemo(() => items.filter(isChoiceItem).map((i) => toChallenge(i, 4)), [items]);

  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [lane, setLaneUI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [end, setEnd] = useState(false);

  const q = qs[idx];
  const lanes = lanesFor(q.choices.length);
  const start = useRef(Date.now());
  const totalRef = useRef(score);
  const streak = useRef(0);
  const livesRef = useRef(LIVES);
  const round = useRef<Round>(makeRound(lanes, { speed: relaxed ? 5.5 : 9, gateDist: relaxed ? 70 : 62 }));
  const py = useRef(((round.current.lane + 0.5) * H) / lanes);
  const dist = useRef(0);
  const flash = useRef(0);

  const speedNow = () => (relaxed ? 5.5 : 9) + Math.min(streak.current, 5) * 0.5;
  const active = picked === null && !end;

  const choose = (l: number) => {
    setLane(round.current, l);
    setLaneUI(round.current.lane);
  };
  const move = (d: number) => {
    moveLane(round.current, d);
    setLaneUI(round.current.lane);
  };

  const resolve = (choice: number) => {
    const ok = choice === q.correct;
    const r = onAnswer({ itemId: q.item.id, correct: ok, timeMs: Date.now() - start.current });
    totalRef.current = r.total;
    streak.current = ok ? streak.current + 1 : 0;
    playSound(ok ? 'correct' : 'wrong');
    if (!ok) {
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      flash.current = 1;
    }
    setPicked(choice);
    setRes(r);
  };

  const onFrame = (dt: number, ctx: CanvasRenderingContext2D | null) => {
    const r = round.current;
    if (active && dt > 0) {
      r.speed = speedNow();
      dist.current += r.speed * dt;
      for (const e of stepRound(r, dt)) {
        if (e.type === 'hit') {
          playSound('wrong');
          livesRef.current = Math.max(0, livesRef.current - 1);
          setLives(livesRef.current);
          flash.current = 1;
          if (livesRef.current <= 0) setEnd(true);
        } else resolve(e.choice);
      }
    }
    const laneH = H / r.lanes;
    py.current += ((r.lane + 0.5) * laneH - py.current) * Math.min(1, dt * 16 + (dt === 0 ? 1 : 0));
    flash.current = Math.max(0, flash.current - dt * 2.5);
    if (!ctx) return;

    // Spuren
    for (let i = 0; i < r.lanes; i++) {
      ctx.fillStyle = i % 2 ? '#141A2C' : '#10162A';
      ctx.fillRect(0, i * laneH, W, laneH);
      ctx.fillStyle = `${CHOICE_COLORS[i]}${i === r.lane ? '26' : '12'}`;
      ctx.fillRect(0, i * laneH, W, laneH);
    }
    // laufende Streifen (Tempo-Gefühl)
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    const off = (dist.current * PPM) % 48;
    for (let i = 1; i < r.lanes; i++) for (let x = -off; x < W; x += 48) ctx.fillRect(x, i * laneH - 1, 24, 2);
    // Tor
    const gx = PX + r.gate * PPM;
    if (gx < W + 40 && r.resolved === null) {
      for (let i = 0; i < r.lanes; i++) {
        ctx.fillStyle = CHOICE_COLORS[i];
        ctx.fillRect(gx - 5, i * laneH + 3, 10, laneH - 6);
        label(ctx, LETTERS[i], gx + 22, (i + 0.5) * laneH, 26, CHOICE_COLORS[i], 900);
      }
    }
    // Hindernisse
    for (const o of r.obstacles) {
      const x = PX + o.d * PPM;
      if (x > -30 && x < W + 30) emoji(ctx, '🧱', x, (o.lane + 0.5) * laneH, Math.min(34, laneH - 10), o.hit ? 0.25 : 1);
    }
    // Buchstaben links (welche Spur gehört zu welcher Antwort)
    for (let i = 0; i < r.lanes; i++) {
      ctx.fillStyle = CHOICE_COLORS[i];
      ctx.beginPath();
      ctx.arc(16, (i + 0.5) * laneH, 11, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, LETTERS[i], 16, (i + 0.5) * laneH + 1, 13, '#0B1020', 900);
    }
    // Läufer (schaut nach rechts)
    ctx.save();
    ctx.translate(PX, py.current);
    ctx.scale(-1, 1);
    emoji(ctx, '🏃', 0, Math.sin(dist.current * 1.6) * 2, Math.min(38, laneH - 8));
    ctx.restore();
    if (flash.current > 0) {
      ctx.fillStyle = `rgba(239,68,68,${flash.current * 0.35})`;
      ctx.fillRect(0, 0, W, H);
    }
  };

  useKeys((e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') move(-1);
    else if (e.key === 'ArrowDown' || e.key === 's') move(1);
    else {
      const n = Number(e.key);
      if (n >= 1 && n <= lanes) choose(n - 1);
    }
  }, active);

  const over = res !== null && (livesRef.current <= 0 || idx + 1 >= qs.length);
  const next = () => {
    if (over) {
      setEnd(true);
      return;
    }
    const n = qs[idx + 1];
    const l = lanesFor(n.choices.length);
    round.current = makeRound(l, { speed: speedNow(), gateDist: relaxed ? 70 : 62, startLane: round.current.lane });
    setLaneUI(round.current.lane);
    setPicked(null);
    setRes(null);
    setIdx(idx + 1);
    start.current = Date.now();
  };

  if (end) {
    const win = livesRef.current > 0;
    return (
      <GameEnd
        win={win}
        icon={win ? 'trophy' : 'heart'}
        title={win ? 'Ziel erreicht!' : 'Außer Atem'}
        text={win ? `Du bist durch alle ${qs.length} Tore gelaufen – mit ${livesRef.current} ${livesRef.current === 1 ? 'Herz' : 'Herzen'} übrig.` : 'Zu viele Hindernisse und falsche Tore – nächster Versuch!'}
        onDone={() => onFinish({ score: totalRef.current, maxScore: qs.length * 150 })}
      />
    );
  }

  const correct = picked !== null && picked === q.correct;
  return (
    <ModeFrame padBottom={picked !== null}>
      <ModeHeader onClose={onClose} current={idx + (picked !== null ? 1 : 0)} total={qs.length} score={score} title="Lern-Runner" lookup={picked !== null ? itemText(q.item) : undefined} right={<Hearts lives={lives} max={LIVES} />} />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={q.item.chapter} />
        <h1 className="mt-2 font-display text-[21px] leading-snug lg:text-3xl" data-testid="question">
          {q.item.type === 'truefalse' && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
          {q.question}
        </h1>
        <div className="mx-auto mt-3 max-w-[480px]">
          <Stage w={W} h={H} active={active} onFrame={onFrame} onTap={(_, y) => choose(Math.floor((y / H) * lanes))} onSwipe={(d) => (d === 'up' ? move(-1) : d === 'down' ? move(1) : undefined)} label={`Laufstrecke mit ${lanes} Spuren`} testId="runner" />
          <p className="mt-2 text-center text-xs text-mute">Tippe eine Spur oder wische hoch/runter. PC: ↑ ↓ oder 1–{lanes}. Weich den Steinen aus!</p>
        </div>
        <div className="mt-3">
          <ChoiceList choices={q.choices} onPick={choose} selected={picked === null ? lane : null} picked={picked} correct={q.correct} disabled={picked !== null} />
        </div>
      </div>
      {picked !== null && res && (
        <FeedbackSheet
          correct={correct}
          title={correct ? 'Richtiges Tor!' : 'Falsches Tor'}
          points={res.points}
          text={q.item.explanation ?? (correct ? undefined : `Richtig wäre: ${q.choices[q.correct]}`)}
          law={q.item.law}
          nextLabel={over ? 'Weiter' : 'Weiterlaufen'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
