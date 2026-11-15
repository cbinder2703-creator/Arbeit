import { useEffect, useMemo, useRef, useState } from 'react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { isChoiceItem, toChallenge } from '@/engine/choices';
import type { Challenge } from '@/engine/choices';
import { itemText } from '@/engine/describe';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { ChapterChip } from '@/ui/ChapterChip';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';
import { Stage } from '@/ui/game/Stage';
import type { SwipeDir } from '@/ui/game/Stage';
import { Hearts } from '@/ui/game/Hearts';
import { GameEnd } from '@/ui/game/GameEnd';
import { ChoiceList } from '@/ui/game/ChoiceList';
import { emoji, label } from '@/ui/game/draw';
import { COLS, MONSTERS, ROWS, findPath, generateDungeon, same } from './dungeon';
import type { Dungeon, Pos } from './dungeon';

const TS = 40;
const W = COLS * TS;
const H = ROWS * TS;
const MAX_HEARTS = 3;
const STEP_S = 0.11;
export const MAX_MONSTERS = 7;

const HINT = 'Tippe auf ein Feld, um hinzulaufen. Oder wische / nutze die Pfeiltasten. Das Tor ist zu, bis alle Monster besiegt sind.';

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const qs = useMemo(() => items.filter(isChoiceItem).map((i) => toChallenge(i, 4)), [items]);
  const total = Math.min(MAX_MONSTERS, qs.length);
  const dungeon = useRef<Dungeon>(null as unknown as Dungeon);
  if (!dungeon.current) dungeon.current = generateDungeon(total);
  const queue = useRef<Challenge[]>([...qs]);
  const pos = useRef<Pos>({ ...dungeon.current.start });
  const drawPos = useRef({ x: pos.current.c * TS, y: pos.current.r * TS });
  const path = useRef<Pos[]>([]);
  const stepT = useRef(0);
  const clock = useRef(0);
  const livesRef = useRef(MAX_HEARTS);
  const totalRef = useRef(score);
  const start = useRef(Date.now());

  const [lives, setLives] = useState(MAX_HEARTS);
  const [defeated, setDefeated] = useState(0);
  const [fight, setFight] = useState<{ mi: number; q: Challenge } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [hint, setHint] = useState(HINT);
  const [end, setEnd] = useState<'win' | 'lose' | null>(null);

  const active = !fight && !end;
  const remaining = () => dungeon.current.monsters.filter((m) => m.alive).length;

  const beginFight = (mi: number) => {
    path.current = [];
    start.current = Date.now();
    setPicked(null);
    setRes(null);
    setFight({ mi, q: queue.current[0] });
  };

  const arrive = (t: Pos) => {
    const d = dungeon.current;
    const mi = d.monsters.findIndex((m) => m.alive && same(m, t));
    if (mi >= 0) return beginFight(mi);
    if (same(t, d.exit)) {
      if (remaining() > 0) {
        path.current = [];
        setHint(`Das Tor ist verschlossen – noch ${remaining()} ${remaining() === 1 ? 'Monster' : 'Monster'} im Verlies!`);
        return;
      }
      pos.current = { ...t };
      setEnd('win');
      return;
    }
    const h = d.hearts.find((x) => !x.taken && same(x, t));
    if (h) {
      h.taken = true;
      if (livesRef.current < MAX_HEARTS) {
        livesRef.current += 1;
        setLives(livesRef.current);
        setHint('❤️ Ein Herz gefunden!');
      }
      playSound('correct');
    }
    pos.current = { ...t };
  };

  const step = (dc: number, dr: number) => {
    if (!active) return;
    path.current = [];
    const t = { c: pos.current.c + dc, r: pos.current.r + dr };
    if (t.c < 0 || t.r < 0 || t.c >= COLS || t.r >= ROWS || dungeon.current.wall[t.r][t.c]) return;
    arrive(t);
  };
  const swipe = (d: SwipeDir) => step(d === 'left' ? -1 : d === 'right' ? 1 : 0, d === 'up' ? -1 : d === 'down' ? 1 : 0);

  const tapTile = (x: number, y: number) => {
    if (!active) return;
    const t = { c: Math.floor(x / TS), r: Math.floor(y / TS) };
    path.current = findPath(dungeon.current.wall, pos.current, t);
    stepT.current = STEP_S; // sofort losgehen
  };

  const resolve = (choice: number) => {
    if (!fight || picked !== null) return;
    const ok = choice === fight.q.correct;
    const r = onAnswer({ itemId: fight.q.item.id, correct: ok, timeMs: Date.now() - start.current });
    totalRef.current = r.total;
    playSound(ok ? 'correct' : 'wrong');
    if (ok) queue.current.shift();
    else {
      queue.current.push(queue.current.shift()!);
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
    }
    setPicked(choice);
    setRes(r);
  };

  const next = () => {
    if (!fight || picked === null) return;
    const ok = picked === fight.q.correct;
    if (ok) {
      const m = dungeon.current.monsters[fight.mi];
      m.alive = false;
      pos.current = { c: m.c, r: m.r };
      const left = remaining();
      setDefeated(total - left);
      setHint(left === 0 ? '🚪 Alle Monster besiegt – lauf zum Tor!' : HINT);
    } else if (livesRef.current <= 0) {
      setFight(null);
      setEnd('lose');
      return;
    }
    setFight(null);
    setPicked(null);
    setRes(null);
  };

  useKeys((e) => {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w') step(0, -1);
    else if (k === 'ArrowDown' || k === 's') step(0, 1);
    else if (k === 'ArrowLeft' || k === 'a') step(-1, 0);
    else if (k === 'ArrowRight' || k === 'd') step(1, 0);
    else return;
    e.preventDefault();
  }, active);
  useKeys((e) => {
    const n = Number(e.key);
    if (fight && picked === null && n >= 1 && n <= fight.q.choices.length) resolve(n - 1);
  }, !!fight && picked === null);

  // das Fenster der Frage nach oben holen – falls es unter der Karte liegt
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.scrollIntoView?.({ block: 'nearest' });
  }, [fight]);

  const onFrame = (dt: number, ctx: CanvasRenderingContext2D | null) => {
    clock.current += dt;
    if (active && path.current.length) {
      stepT.current += dt;
      if (stepT.current >= STEP_S) {
        stepT.current = 0;
        arrive(path.current.shift()!);
      }
    }
    const k = Math.min(1, dt * 18 + (dt === 0 ? 1 : 0));
    drawPos.current.x += (pos.current.c * TS - drawPos.current.x) * k;
    drawPos.current.y += (pos.current.r * TS - drawPos.current.y) * k;
    if (!ctx) return;
    const d = dungeon.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TS;
        const y = r * TS;
        if (d.wall[r][c]) {
          ctx.fillStyle = '#2A3150';
          ctx.fillRect(x, y, TS, TS);
          ctx.fillStyle = '#353E63';
          ctx.fillRect(x + 2, y + 2, TS - 4, TS / 2 - 3);
          ctx.fillRect(x + 2, y + TS / 2 + 1, TS - 4, TS / 2 - 3);
        } else {
          ctx.fillStyle = (c + r) % 2 ? '#141A2E' : '#111729';
          ctx.fillRect(x, y, TS, TS);
        }
      }
    }
    // Tor
    const locked = remaining() > 0;
    emoji(ctx, '🚪', d.exit.c * TS + TS / 2, d.exit.r * TS + TS / 2, 30, locked ? 0.55 : 1);
    if (locked) emoji(ctx, '🔒', d.exit.c * TS + TS - 9, d.exit.r * TS + TS - 9, 14);
    for (const h of d.hearts) if (!h.taken) emoji(ctx, '❤️', h.c * TS + TS / 2, h.r * TS + TS / 2 + Math.sin(clock.current * 3 + h.c) * 2, 22);
    for (const m of d.monsters) {
      if (!m.alive) continue;
      const fighting = fight && d.monsters[fight.mi] === m;
      const bob = Math.sin(clock.current * 2.4 + m.c * 1.7 + m.r) * 2;
      if (fighting) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(m.c * TS + TS / 2, m.r * TS + TS / 2, TS / 2 - 2 + Math.sin(clock.current * 9) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      emoji(ctx, MONSTERS[m.kind % MONSTERS.length], m.c * TS + TS / 2, m.r * TS + TS / 2 + bob, 30);
    }
    emoji(ctx, '🧙', drawPos.current.x + TS / 2, drawPos.current.y + TS / 2 + Math.sin(clock.current * 6) * 1.2, 32);
    // Fackellicht: Ränder etwas dunkler
    const g = ctx.createRadialGradient(drawPos.current.x + TS / 2, drawPos.current.y + TS / 2, TS * 2.5, drawPos.current.x + TS / 2, drawPos.current.y + TS / 2, TS * 8);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    label(ctx, `${total - remaining()}/${total}`, W - 26, 14, 12, '#94A3B8', 800);
  };

  if (end) {
    const win = end === 'win';
    return (
      <GameEnd
        win={win}
        icon={win ? 'trophy' : 'heart'}
        title={win ? 'Verlies geschafft!' : 'Das Verlies hat gewonnen'}
        text={win ? `Alle ${total} Monster besiegt – mit ${livesRef.current} ${livesRef.current === 1 ? 'Herz' : 'Herzen'} übrig.` : `${defeated} von ${total} Monstern besiegt. Nächster Versuch!`}
        onDone={() => onFinish({ score: totalRef.current, maxScore: total * 150 })}
      />
    );
  }

  const q = fight?.q;
  const correct = !!q && picked !== null && picked === q.correct;
  return (
    <ModeFrame padBottom={!!fight}>
      <ModeHeader onClose={onClose} current={defeated} total={total} score={score} title="Verlies" lookup={q && picked !== null ? itemText(q.item) : undefined} right={<Hearts lives={lives} max={MAX_HEARTS} />} />
      <div className="flex-1 px-4 pb-6">
        <div className="mx-auto max-w-[440px]">
          <Stage w={W} h={H} active={active} onFrame={onFrame} onTap={tapTile} onSwipe={swipe} label={`Verlies-Karte, ${defeated} von ${total} Monstern besiegt`} testId="dungeon" />
          <p className="mt-2 text-center text-xs text-mute" data-testid="hint">{hint}</p>
        </div>
      </div>

      {q && picked === null && (
        <div ref={panel} data-testid="fight" className="fixed inset-x-0 bottom-0 z-30 mx-auto max-h-[75dvh] w-full max-w-3xl overflow-auto rounded-t-3xl border-t border-line bg-card p-4 shadow-2xl animate-sheet">
          <div className="flex items-center gap-2 text-sm font-bold text-bad">
            <span className="text-2xl">{MONSTERS[dungeon.current.monsters[fight.mi].kind % MONSTERS.length]}</span> Ein Monster versperrt den Weg!
          </div>
          <ChapterChip chapter={q.item.chapter} />
          <h2 className="mt-2 font-display text-[18px] leading-snug lg:text-2xl" data-testid="question">
            {q.item.type === 'truefalse' && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
            {q.question}
          </h2>
          <div className="mt-3">
            <ChoiceList choices={q.choices} onPick={resolve} />
          </div>
        </div>
      )}
      {q && picked !== null && res && (
        <FeedbackSheet
          correct={correct}
          title={correct ? 'Monster besiegt!' : 'Das Monster hält stand'}
          points={res.points}
          text={q.item.explanation ?? (correct ? undefined : `Richtig wäre: ${q.choices[q.correct]}`)}
          law={q.item.law}
          nextLabel={!correct && livesRef.current <= 0 ? 'Weiter' : 'Weiter im Verlies'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
