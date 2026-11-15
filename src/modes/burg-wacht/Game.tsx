import { useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { isChoiceItem, toChallenge } from '@/engine/choices';
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
import { emoji, label } from '@/ui/game/draw';
import { CASTLE_HP, LANES, MAX_LEVEL, idle, makeDefense, punish, queueWave, stepDefense, upgrade } from './defense';
import type { Defense } from './defense';

const W = 360;
const LH = 72;
const TOP = 6;
const H = TOP * 2 + LANES * LH;
const CASTLE_W = 52;
const TOWER_X = 78;
const ENEMIES = ['👹', '👺', '🧟', '🐗'] as const;
const BUILD_KEYS = ['q', 'w', 'e', 'r'];

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const reduce = useReducedMotion();
  const relaxed = useSettings((s) => s.relaxed) || !!reduce;
  const speed = relaxed ? 15 : 24;
  const qs = useMemo(() => items.filter(isChoiceItem).map((i) => toChallenge(i, 4)), [items]);

  const def = useRef<Defense>(null as unknown as Defense);
  if (!def.current) {
    def.current = makeDefense();
    queueWave(def.current, 0, speed);
  }
  const [idx, setIdx] = useState(0);
  const [tokens, setTokens] = useState(0);
  const tokensRef = useRef(0);
  const [castle, setCastle] = useState(CASTLE_HP);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [final, setFinal] = useState(false);
  const [hint, setHint] = useState('');
  const [end, setEnd] = useState<'win' | 'lose' | null>(null);
  const start = useRef(Date.now());
  const totalRef = useRef(score);
  const clock = useRef(0);
  const shownCastle = useRef(CASTLE_HP);

  const q = qs[idx];
  const active = picked === null && !end;

  const addTokens = (n: number) => {
    tokensRef.current += n;
    setTokens(tokensRef.current);
  };

  const build = (lane: number) => {
    if (end || lane < 0 || lane >= LANES) return;
    if (tokensRef.current <= 0) {
      setHint('Du hast keinen Baupunkt – beantworte erst eine Frage richtig.');
      return;
    }
    if (!upgrade(def.current, lane)) {
      setHint('Dieser Turm hat schon die höchste Stufe.');
      return;
    }
    addTokens(-1);
    setHint('');
    playSound('correct');
  };

  const resolve = (choice: number) => {
    if (picked !== null || !q) return;
    const ok = choice === q.correct;
    const r = onAnswer({ itemId: q.item.id, correct: ok, timeMs: Date.now() - start.current });
    totalRef.current = r.total;
    playSound(ok ? 'correct' : 'wrong');
    if (ok) {
      addTokens(1);
      setHint('');
    } else punish(def.current, idx, speed);
    setPicked(choice);
    setRes(r);
  };

  const next = () => {
    if (idx + 1 >= qs.length) {
      setFinal(true);
    } else {
      queueWave(def.current, idx + 1, speed);
      setIdx(idx + 1);
      start.current = Date.now();
    }
    setPicked(null);
    setRes(null);
  };

  const onFrame = (dt: number, ctx: CanvasRenderingContext2D | null) => {
    clock.current += dt;
    const d = def.current;
    if (active && dt > 0) {
      stepDefense(d, dt);
      if (d.castle !== shownCastle.current) {
        shownCastle.current = d.castle;
        setCastle(d.castle);
        playSound('wrong');
      }
      if (d.castle <= 0) setEnd('lose');
      else if (final && idle(d)) setEnd('win');
    }
    if (!ctx) return;
    // Spuren
    for (let l = 0; l < LANES; l++) {
      ctx.fillStyle = l % 2 ? '#1B2A1E' : '#17241A';
      ctx.fillRect(CASTLE_W, TOP + l * LH, W - CASTLE_W, LH);
      ctx.fillStyle = 'rgba(255,255,255,.05)';
      ctx.fillRect(CASTLE_W, TOP + l * LH + LH - 1, W - CASTLE_W, 1);
    }
    // Burg
    ctx.fillStyle = '#3B4466';
    ctx.fillRect(0, 0, CASTLE_W, H);
    ctx.fillStyle = '#4A5580';
    for (let y = 8; y < H; y += 24) ctx.fillRect(4, y, CASTLE_W - 8, 10);
    emoji(ctx, '🏰', 24, H / 2, 40);
    // Türme
    for (let l = 0; l < LANES; l++) {
      const y = TOP + l * LH + LH / 2;
      const lvl = d.towers[l];
      if (lvl === 0) {
        ctx.strokeStyle = tokensRef.current > 0 ? `rgba(250,204,21,${0.55 + Math.sin(clock.current * 6) * 0.35})` : 'rgba(148,163,184,.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(TOWER_X, y, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, '+', TOWER_X, y, 22, '#94A3B8', 800);
      } else {
        emoji(ctx, lvl === 1 ? '🏹' : lvl === 2 ? '🔱' : '💥', TOWER_X, y - 4, 26 + lvl * 2);
        for (let i = 0; i < MAX_LEVEL; i++) {
          ctx.fillStyle = i < lvl ? '#FACC15' : 'rgba(148,163,184,.35)';
          ctx.fillRect(TOWER_X - 15 + i * 11, y + 21, 9, 4);
        }
      }
    }
    // Schüsse
    for (const s of d.shots) {
      const y = TOP + s.lane * LH + LH / 2;
      ctx.strokeStyle = `rgba(250,204,21,${1 - s.age / 0.18})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(TOWER_X + 16, y);
      ctx.lineTo(CASTLE_W + s.x, y);
      ctx.stroke();
    }
    // Gegner
    for (const e of d.enemies) {
      const x = CASTLE_W + e.x;
      const y = TOP + e.lane * LH + LH / 2 + Math.sin(clock.current * 8 + e.id) * 1.5;
      emoji(ctx, ENEMIES[e.kind % ENEMIES.length], x, y, 32);
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(x - 14, y - 26, 28, 4);
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(x - 14, y - 26, (28 * e.hp) / e.maxHp, 4);
    }
  };

  useKeys((e) => {
    const l = BUILD_KEYS.indexOf(e.key.toLowerCase());
    if (l >= 0) build(l);
  }, !end && picked === null);
  useKeys((e) => {
    const n = Number(e.key);
    if (q && n >= 1 && n <= q.choices.length) resolve(n - 1);
  }, !end && !final && picked === null);

  if (end) {
    const win = end === 'win';
    return (
      <GameEnd
        win={win}
        icon={win ? 'shield' : 'heart'}
        title={win ? 'Burg gerettet!' : 'Die Burg ist gefallen'}
        text={win ? `Alle Wellen abgewehrt – ${castle} von ${CASTLE_HP} Burg-Herzen übrig, ${def.current.killed} Gegner besiegt.` : `${def.current.killed} Gegner besiegt. Mit richtigen Antworten baust du stärkere Türme – nächster Versuch!`}
        onDone={() => onFinish({ score: totalRef.current, maxScore: qs.length * 150 })}
      />
    );
  }

  const correct = picked !== null && q && picked === q.correct;
  return (
    <ModeFrame padBottom={picked !== null}>
      <ModeHeader
        onClose={onClose}
        current={idx + (picked !== null ? 1 : 0)}
        total={qs.length}
        score={score}
        title="Burg-Wacht"
        lookup={picked !== null && q ? itemText(q.item) : undefined}
        right={
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-card-hi px-2 py-0.5 text-xs font-bold text-xp" data-testid="tokens" aria-label={`${tokens} Baupunkte`}>🔧 {tokens}</span>
            <Hearts lives={castle} max={CASTLE_HP} testId="castle" />
          </span>
        }
      />
      <div className="flex-1 px-4 pb-6">
        {!final && q && (
          <>
            <ChapterChip chapter={q.item.chapter} />
            <h1 className="mt-2 font-display text-[19px] leading-snug lg:text-3xl" data-testid="question">
              {q.item.type === 'truefalse' && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
              {q.question}
            </h1>
          </>
        )}
        {final && (
          <h1 className="font-display text-[22px] leading-snug" data-testid="final">
            Letzte Verteidigung! Halte die Burg, bis alle Gegner weg sind.
          </h1>
        )}
        <div className="mx-auto mt-3 max-w-[480px]">
          <Stage w={W} h={H} active={active} onFrame={onFrame} onTap={(_, y) => build(Math.floor((y - TOP) / LH))} label="Spielfeld: vier Spuren, links die Burg" testId="field" />
          <p className="mt-2 min-h-[2.5rem] text-center text-xs text-mute" data-testid="hint">
            {hint || (tokens > 0 ? '🔧 Tippe eine Spur: Turm bauen oder verstärken (PC: Q W E R).' : 'Richtige Antwort = Baupunkt. Falsche Antwort = zusätzliche Gegner.')}
          </p>
        </div>
        {!final && q && (
          <div className="mt-2">
            <ChoiceList choices={q.choices} onPick={resolve} picked={picked} correct={q.correct} disabled={picked !== null} />
          </div>
        )}
      </div>
      {picked !== null && res && q && (
        <FeedbackSheet
          correct={!!correct}
          title={correct ? 'Treffer! +1 Baupunkt' : 'Falsch – Verstärkung für die Gegner!'}
          points={res.points}
          text={q.item.explanation ?? (correct ? undefined : `Richtig wäre: ${q.choices[q.correct]}`)}
          law={q.item.law}
          nextLabel={idx + 1 >= qs.length ? 'Zur letzten Verteidigung' : 'Nächste Welle'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
