import { useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { isChoiceItem, toChallenge } from '@/engine/choices';
import { makeFlight, nearest, setTarget, stepFlight } from '@/engine/spaceRun';
import type { Flight } from '@/engine/spaceRun';
import { itemText } from '@/engine/describe';
import { useSettings } from '@/store/settings';
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
import { SpaceScene } from './scene';

export const LIVES = 3;
const SPEED = 10;
const SPEED_RELAXED = 6;
const GATE = 78;

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const reduce = useReducedMotion();
  const relaxed = useSettings((s) => s.relaxed) || !!reduce;
  const base = relaxed ? SPEED_RELAXED : SPEED;
  const qs = useMemo(() => items.filter(isChoiceItem).map((i) => toChallenge(i, 4)), [items]);

  const [idx, setIdx] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [near, setNear] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [end, setEnd] = useState(false);
  const [flash, setFlash] = useState(false);

  const q = qs[idx];
  const start = useRef(Date.now());
  const totalRef = useRef(score);
  const streak = useRef(0);
  const livesRef = useRef(LIVES);
  const flight = useRef<Flight>(makeFlight(q.choices.length, { speed: base, gateDist: GATE }));
  const nearRef = useRef(0);
  const pressed = useRef(false);

  const hurt = (scene: SpaceScene | null) => {
    livesRef.current = Math.max(0, livesRef.current - 1);
    setLives(livesRef.current);
    scene?.hit();
    setFlash(true);
    setTimeout(() => setFlash(false), 260);
  };

  const resolve = (choice: number, scene: SpaceScene | null) => {
    const ok = choice === q.correct;
    const r = onAnswer({ itemId: q.item.id, correct: ok, timeMs: Date.now() - start.current });
    totalRef.current = r.total;
    streak.current = ok ? streak.current + 1 : 0;
    playSound(ok ? 'correct' : 'wrong');
    if (!ok) hurt(scene);
    setPicked(choice);
    setRes(r);
  };

  const active = picked === null && !end;
  const { host, scene, unsupported } = useScene3D(
    (el, w, h) => {
      const s = new SpaceScene(el, w, h);
      s.setFlight(flight.current, q.choices);
      return s;
    },
    (s, dt) => {
      const f = flight.current;
      if (active && dt > 0) {
        f.speed = base + Math.min(streak.current, 5) * 0.8;
        for (const e of stepFlight(f, dt)) {
          if (e.type === 'hit') {
            playSound('wrong');
            hurt(s);
            if (livesRef.current <= 0) setEnd(true);
          } else resolve(e.choice, s);
        }
        const n = nearest(f);
        if (n !== nearRef.current) {
          nearRef.current = n;
          setNear(n);
        }
      }
      s.update(f, dt, f.speed - base);
    },
    !end,
  );

  const aim = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTarget(flight.current, ((e.clientX - r.left) / (r.width || 1)) * 2 - 1, -(((e.clientY - r.top) / (r.height || 1)) * 2 - 1));
  };
  const toZone = (i: number) => {
    const z = flight.current.zones[i];
    if (z) setTarget(flight.current, z.x, z.y);
  };

  useKeys((e) => {
    const f = flight.current;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') setTarget(f, f.tx - 0.35, f.ty);
    else if (k === 'arrowright' || k === 'd') setTarget(f, f.tx + 0.35, f.ty);
    else if (k === 'arrowup' || k === 'w') setTarget(f, f.tx, f.ty + 0.35);
    else if (k === 'arrowdown' || k === 's') setTarget(f, f.tx, f.ty - 0.35);
    else {
      const n = Number(e.key);
      if (n >= 1 && n <= q.choices.length) toZone(n - 1);
      else return;
    }
    e.preventDefault();
  }, active && !unsupported);

  const over = res !== null && (livesRef.current <= 0 || idx + 1 >= qs.length);
  const next = () => {
    if (over) {
      setEnd(true);
      return;
    }
    const n = qs[idx + 1];
    const f = makeFlight(n.choices.length, { speed: base + Math.min(streak.current, 5) * 0.8, gateDist: GATE });
    f.x = flight.current.x;
    f.y = flight.current.y;
    setTarget(f, flight.current.tx, flight.current.ty);
    flight.current = f;
    scene.current?.setFlight(f, n.choices);
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
        icon={win ? 'rocket' : 'heart'}
        title={win ? 'Mission geschafft!' : 'Schiff zerstört'}
        text={win ? `Alle ${qs.length} Ringe erreicht – mit ${livesRef.current} ${livesRef.current === 1 ? 'Herz' : 'Herzen'} übrig.` : 'Zu viele Treffer und falsche Ringe – nächster Flug!'}
        onDone={() => onFinish({ score: totalRef.current, maxScore: qs.length * 150 })}
      />
    );
  }
  if (unsupported) return <NoWebGL title="Raumflug 3D" total={qs.length} score={score} onClose={onClose} />;

  const correct = picked !== null && picked === q.correct;
  return (
    <ModeFrame padBottom={picked !== null}>
      <ModeHeader onClose={onClose} current={idx + (picked !== null ? 1 : 0)} total={qs.length} score={score} title="Raumflug" lookup={picked !== null ? itemText(q.item) : undefined} right={<Hearts lives={lives} max={LIVES} />} />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={q.item.chapter} />
        <h1 className="mt-2 font-display text-[21px] leading-snug lg:text-3xl" data-testid="question">
          {q.item.type === 'truefalse' && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
          {q.question}
        </h1>
        <div className="mx-auto mt-3 max-w-[480px]">
          <div className="relative overflow-hidden rounded-3xl border border-line">
            <div
              ref={host}
              className="aspect-[5/4] w-full touch-none select-none bg-[#050816]"
              role="img"
              aria-label={`Raumflug mit ${q.choices.length} Ringen`}
              data-testid="space"
              onPointerDown={(e) => {
                pressed.current = true;
                e.currentTarget.setPointerCapture?.(e.pointerId);
                aim(e);
              }}
              onPointerMove={(e) => {
                if (pressed.current || e.pointerType === 'mouse') aim(e);
              }}
              onPointerUp={() => {
                pressed.current = false;
              }}
              onPointerCancel={() => {
                pressed.current = false;
              }}
            />
            {flash && <div className="pointer-events-none absolute inset-0 bg-bad/30" />}
          </div>
          <p className="mt-2 text-center text-xs text-mute">Zieh den Finger (oder die Maus) im Bild – das Schiff folgt. PC: Pfeiltasten oder 1–{q.choices.length}. Weich den Felsen aus!</p>
        </div>
        <div className="mt-3">
          <ChoiceList choices={q.choices} onPick={toZone} selected={picked === null ? near : null} picked={picked} correct={q.correct} disabled={picked !== null} />
        </div>
      </div>
      {picked !== null && res && (
        <FeedbackSheet
          correct={correct}
          title={correct ? 'Richtiger Ring!' : 'Falscher Ring'}
          points={res.points}
          text={q.item.explanation ?? (correct ? undefined : `Richtig wäre: ${q.choices[q.correct]}`)}
          law={q.item.law}
          nextLabel={over ? 'Weiter' : 'Weiterfliegen'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
