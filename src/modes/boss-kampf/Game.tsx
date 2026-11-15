import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ModeProps, PlayItem } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { COMBO_FROM } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { useSettings } from '@/store/settings';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { TimerRing } from '@/ui/TimerRing';
import { ChapterChip } from '@/ui/ChapterChip';
import { Chip } from '@/ui/Chip';
import { Button } from '@/ui/Button';
import { Confetti } from '@/ui/Confetti';
import { Icon } from '@/ui/Icon';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';

export const HEARTS = 3;
const LIMIT_MS = 20_000;
const BOSSES = ['Der Prüfungs-Drache', 'Professor Panik', 'Die Klausur-Hydra', 'Der Fehlerteufel', 'Meister Stress', 'Der Vergessens-Geist'];

/** So viele Treffer braucht man: Bei 3 Herzen darf man 2 Fehler machen – damit ist der Kampf nach spätestens n Fragen entschieden. */
export const bossLife = (n: number): number => Math.max(1, n - (HEARTS - 1));

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const relaxedSetting = useSettings((s) => s.relaxed);
  const qs = useMemo(() => items.filter((i): i is Extract<PlayItem, { type: 'mc' | 'truefalse' }> => i.type === 'mc' || i.type === 'truefalse'), [items]);
  const boss = useMemo(() => BOSSES[Math.floor(Math.random() * BOSSES.length)], []);
  const maxHp = bossLife(qs.length);

  const [idx, setIdx] = useState(0);
  const [hearts, setHearts] = useState(HEARTS);
  const [hp, setHp] = useState(maxHp);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0); // zählt Treffer/Schläge → startet die Animation neu
  const [flash, setFlash] = useState<'hit' | 'hurt' | null>(null);
  const [remaining, setRemaining] = useState(LIMIT_MS);
  const [end, setEnd] = useState<'win' | 'lose' | null>(null);
  const pickedRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const pausedAt = useRef(0);
  const start = useRef(Date.now());
  const totalRef = useRef(score);
  const relaxed = relaxedSetting;

  const q = qs[idx];
  const options = q.type === 'mc' ? q.options : ['Wahr', 'Falsch'];
  const correctIdx = q.type === 'mc' ? q.correct : q.correct ? 0 : 1;
  const question = q.type === 'mc' ? q.question : q.statement;
  const correct = picked !== null && picked === correctIdx;

  const answer = useCallback(
    (i: number) => {
      if (pickedRef.current !== null || end) return;
      pickedRef.current = i;
      const ok = i === correctIdx;
      const r = onAnswer({ itemId: q.id, correct: ok, timeMs: Date.now() - start.current, timeLimitMs: relaxed ? undefined : LIMIT_MS });
      totalRef.current = r.total;
      playSound(ok ? 'correct' : 'wrong');
      setPicked(i);
      setRes(r);
      setCombo(r.combo);
      setHits((h) => h + 1);
      if (ok) {
        setHp((h) => Math.max(0, h - 1));
        setFlash('hit');
      } else {
        setHearts((h) => Math.max(0, h - 1));
        setFlash('hurt');
      }
    },
    [correctIdx, end, onAnswer, q.id, relaxed],
  );

  // Zeitlimit (im Entspannt-Modus aus; pausiert, solange „Begriff?“ offen ist)
  useEffect(() => {
    if (relaxed || pickedRef.current !== null) return;
    start.current = Date.now();
    setRemaining(LIMIT_MS);
    const t = setInterval(() => {
      if (pickedRef.current !== null) return clearInterval(t);
      if (pausedRef.current) return;
      const left = LIMIT_MS - (Date.now() - start.current);
      if (left <= 0) {
        clearInterval(t);
        setRemaining(0);
        answer(-1);
      } else setRemaining(left);
    }, 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, relaxed]);

  const over = res !== null && (hp <= 0 || hearts <= 0);
  const next = () => {
    if (over || idx + 1 >= qs.length) {
      setEnd(hp <= 0 ? 'win' : 'lose');
      playSound(hp <= 0 ? 'win' : 'wrong');
      return;
    }
    pickedRef.current = null;
    setPicked(null);
    setRes(null);
    setFlash(null);
    setIdx(idx + 1);
    start.current = Date.now();
  };

  useKeys((e) => {
    const n = Number(e.key);
    if (n >= 1 && n <= options.length) answer(n - 1);
  }, picked === null && !end);

  if (end) {
    const win = end === 'win';
    return (
      <ModeFrame>
        {win && <Confetti count={70} />}
        <div className="grid flex-1 place-items-center px-6 text-center" data-testid="end" data-result={end}>
          <div>
            <span className={`mx-auto grid h-24 w-24 place-items-center rounded-3xl ${win ? 'bg-good/20 text-good' : 'bg-bad/20 text-bad'}`}>
              <Icon name={win ? 'trophy' : 'skull'} size={52} />
            </span>
            <h1 className="mt-4 text-3xl">{win ? `${boss} besiegt!` : `${boss} war stärker`}</h1>
            <p className="mt-2 text-mute">
              {win ? `Du hast noch ${hearts} ${hearts === 1 ? 'Herz' : 'Herzen'} übrig.` : 'Alle Herzen sind weg – im nächsten Kampf klappt es!'}
            </p>
            <Button className="mt-6" onClick={() => onFinish({ score: totalRef.current, maxScore: qs.length * 150 })}>
              Ergebnis ansehen
            </Button>
          </div>
        </div>
      </ModeFrame>
    );
  }

  return (
    <ModeFrame padBottom={picked !== null}>
      <ModeHeader
        onClose={onClose}
        current={idx + (picked !== null ? 1 : 0)}
        total={qs.length}
        score={score}
        title="Boss-Kampf"
        lookup={itemText(q)}
        onLookupChange={(open) => {
          if (open) {
            pausedRef.current = true;
            pausedAt.current = Date.now();
          } else {
            start.current += Date.now() - pausedAt.current;
            pausedRef.current = false;
          }
        }}
      />
      <div className="flex-1 px-4 pb-6">
        {/* Boss + Herzen */}
        <div className="flex items-center gap-3 rounded-3xl bg-card p-3">
          <div key={`boss-${hits}`} className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${flash === 'hit' ? 'animate-wiggle bg-bad text-white' : flash === 'hurt' ? 'scale-110 bg-bad/40 text-bad' : 'bg-bad/20 text-bad'} transition`} data-testid="boss">
            <Icon name="skull" size={36} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-display text-lg">{boss}</span>
              <span className="text-xs font-bold text-mute" data-testid="boss-hp">{hp}/{maxHp} LP</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Boss-Leben" aria-valuenow={hp} aria-valuemin={0} aria-valuemax={maxHp}>
              <div className="h-full rounded-full bg-gradient-to-r from-bad to-orange-400 transition-all duration-300" style={{ width: `${(hp / maxHp) * 100}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-1" role="img" aria-label={`${hearts} von ${HEARTS} Herzen`} data-testid="hearts">
              {Array.from({ length: HEARTS }, (_, i) => (
                <Icon key={i} name="heart" size={20} className={i < hearts ? 'fill-bad text-bad' : 'text-line'} />
              ))}
              {combo >= COMBO_FROM && (
                <Chip color="#FACC15" className="ml-2">
                  <Icon name="flame" size={12} /> Kritisch ×1,5
                </Chip>
              )}
            </div>
          </div>
          {!relaxed && <TimerRing remainingMs={remaining} totalMs={LIMIT_MS} size={48} />}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <ChapterChip chapter={q.chapter} />
        </div>
        <h1 className="mt-2 font-display text-[22px] leading-snug lg:text-3xl" data-testid="question">
          {q.type === 'truefalse' && <span className="mb-1 block text-sm font-semibold text-mute">Wahr oder falsch?</span>}
          {question}
        </h1>

        <div className="mt-4 grid gap-3 md:grid-cols-2" role="group" aria-label="Antworten">
          {options.map((o, i) => {
            const state = picked === null ? 'idle' : i === correctIdx ? 'right' : i === picked ? 'wrong' : 'dim';
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={picked !== null}
                data-state={state}
                className={`tap flex min-h-[56px] items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left text-[15px] font-medium transition ${
                  state === 'right' ? 'border-good bg-good/15' : state === 'wrong' ? 'animate-wiggle border-bad bg-bad/15' : state === 'dim' ? 'border-line bg-card opacity-50' : 'border-line bg-card hover:border-p/60 active:scale-[0.99]'
                }`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-card-hi text-xs font-bold text-mute">{i + 1}</span>
                <span className="flex-1">{o}</span>
              </button>
            );
          })}
        </div>
      </div>

      {picked !== null && res && (
        <FeedbackSheet
          correct={correct}
          title={picked === -1 ? 'Zeit abgelaufen – der Boss schlägt zu!' : correct ? 'Treffer!' : 'Autsch – der Boss trifft dich'}
          points={res.points}
          text={q.explanation ?? (correct ? undefined : `Richtig wäre: ${options[correctIdx]}`)}
          law={q.law}
          nextLabel={over ? (hp <= 0 ? 'Sieg ansehen' : 'Weiter') : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
