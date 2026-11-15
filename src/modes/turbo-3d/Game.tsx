import { useEffect, useMemo, useRef, useState } from 'react';
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
import { Button } from '@/ui/Button';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';
import { Hearts } from '@/ui/game/Hearts';
import { GameEnd } from '@/ui/game/GameEnd';
import { ChoiceList } from '@/ui/game/ChoiceList';
import { useGestures } from '@/ui/game/useGestures';
import { RaceScene, webglAvailable } from './scene';

export const LIVES = 3;
const SPEED = 12;
const SPEED_RELAXED = 7;
const GATE = 80; // Meter bis zum Tor

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const reduce = useReducedMotion();
  const relaxed = useSettings((s) => s.relaxed) || !!reduce;
  const base = relaxed ? SPEED_RELAXED : SPEED;
  const qs = useMemo(() => items.filter(isChoiceItem).map((i) => toChallenge(i, 4)), [items]);

  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [lane, setLaneUI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [end, setEnd] = useState(false);
  const [unsupported, setUnsupported] = useState(() => !webglAvailable());
  const [flash, setFlash] = useState(false);

  const q = qs[idx];
  const lanes = lanesFor(q.choices.length);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<RaceScene | null>(null);
  const start = useRef(Date.now());
  const totalRef = useRef(score);
  const streak = useRef(0);
  const livesRef = useRef(LIVES);
  const round = useRef<Round>(makeRound(lanes, { speed: base, gateDist: GATE }));
  const active = picked === null && !end && !unsupported;

  const choose = (l: number) => {
    setLane(round.current, l);
    setLaneUI(round.current.lane);
  };
  const move = (d: number) => {
    moveLane(round.current, d);
    setLaneUI(round.current.lane);
  };
  const hurt = () => {
    livesRef.current = Math.max(0, livesRef.current - 1);
    setLives(livesRef.current);
    scene.current?.hit();
    setFlash(true);
    setTimeout(() => setFlash(false), 260);
  };

  const resolve = (choice: number) => {
    const ok = choice === q.correct;
    const r = onAnswer({ itemId: q.item.id, correct: ok, timeMs: Date.now() - start.current });
    totalRef.current = r.total;
    streak.current = ok ? streak.current + 1 : 0;
    playSound(ok ? 'correct' : 'wrong');
    if (!ok) hurt();
    setPicked(choice);
    setRes(r);
  };

  const tick = (dt: number) => {
    const r = round.current;
    if (active && dt > 0) {
      r.speed = base + Math.min(streak.current, 5) * 0.8;
      for (const e of stepRound(r, dt)) {
        if (e.type === 'hit') {
          playSound('wrong');
          hurt();
          if (livesRef.current <= 0) setEnd(true);
        } else resolve(e.choice);
      }
    }
    scene.current?.update(r, dt, r.speed - base);
  };
  const tickRef = useRef(tick);
  tickRef.current = tick;

  // 3D-Szene aufbauen / abbauen, eigene Spielschleife
  useEffect(() => {
    if (unsupported || end || !host.current) return;
    const el = host.current;
    try {
      const s = new RaceScene(el, el.clientWidth || 360, el.clientHeight || 288);
      scene.current = s;
      s.setRound(round.current, qs[idx].choices);
    } catch {
      scene.current = null;
      setUnsupported(true);
      return;
    }
    const onResize = () => scene.current?.resize(el.clientWidth || 360, el.clientHeight || 288);
    window.addEventListener('resize', onResize);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      tickRef.current(Math.min(0.05, Math.max(0, (now - last) / 1000)));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      scene.current?.dispose();
      scene.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unsupported, end]);
  // neue Frage → neue Straße
  useEffect(() => {
    scene.current?.setRound(round.current, q.choices);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const gestures = useGestures(100, 100, (x) => choose(Math.min(lanes - 1, Math.floor((x / 100) * lanes))), (d) => (d === 'left' ? move(-1) : d === 'right' ? move(1) : undefined));
  useKeys((e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') move(-1);
    else if (e.key === 'ArrowRight' || e.key === 'd') move(1);
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
    round.current = makeRound(lanesFor(n.choices.length), { speed: base + Math.min(streak.current, 5) * 0.8, gateDist: GATE, startLane: round.current.lane });
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
        title={win ? 'Ziel erreicht!' : 'Totalschaden'}
        text={win ? `Alle ${qs.length} Tore geschafft – mit ${livesRef.current} ${livesRef.current === 1 ? 'Herz' : 'Herzen'} übrig.` : 'Zu viele Crashs und falsche Tore – nächste Runde!'}
        onDone={() => onFinish({ score: totalRef.current, maxScore: qs.length * 150 })}
      />
    );
  }

  if (unsupported) {
    return (
      <ModeFrame>
        <ModeHeader onClose={onClose} current={0} total={qs.length} score={score} title="Turbo-Rennen 3D" />
        <div className="grid flex-1 place-items-center px-6 text-center" data-testid="no-webgl">
          <div>
            <h1 className="text-2xl">3D geht auf diesem Gerät nicht</h1>
            <p className="mt-2 text-mute">Dein Browser unterstützt WebGL nicht (oder die Grafikbeschleunigung ist aus). Probier stattdessen den Lern-Runner – das ist dasselbe Spiel in 2D.</p>
            <Button className="mt-6" onClick={onClose}>Zurück</Button>
          </div>
        </div>
      </ModeFrame>
    );
  }

  const correct = picked !== null && picked === q.correct;
  return (
    <ModeFrame padBottom={picked !== null}>
      <ModeHeader onClose={onClose} current={idx + (picked !== null ? 1 : 0)} total={qs.length} score={score} title="Turbo-Rennen" lookup={picked !== null ? itemText(q.item) : undefined} right={<Hearts lives={lives} max={LIVES} />} />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={q.item.chapter} />
        <h1 className="mt-2 font-display text-[21px] leading-snug lg:text-3xl" data-testid="question">
          {q.item.type === 'truefalse' && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
          {q.question}
        </h1>
        <div className="mx-auto mt-3 max-w-[480px]">
          <div className="relative overflow-hidden rounded-3xl border border-line">
            <div ref={host} className="aspect-[5/4] w-full touch-none select-none bg-[#0E1530]" role="img" aria-label={`3D-Rennstrecke mit ${lanes} Spuren`} data-testid="race" {...gestures} />
            {flash && <div className="pointer-events-none absolute inset-0 bg-bad/30" />}
          </div>
          <p className="mt-2 text-center text-xs text-mute">Tippe links/rechts oder wische. PC: ← → oder 1–{lanes}. Weich den Kisten aus!</p>
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
          nextLabel={over ? 'Weiter' : 'Weiterfahren'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
