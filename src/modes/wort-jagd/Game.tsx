import { useMemo, useRef, useState } from 'react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { useKeys } from '@/ui/useKeys';
import { playSound } from '@/ui/sound';
import { KEYS, guessWord, isLetter, lettersOf, maskDefinition } from './words';

const LIVES = 6;
const ROUNDS = 6;

export default function Game({ flashcards = [], onAnswer, onFinish, onClose, score }: ModeProps) {
  const rounds = useMemo(
    () =>
      flashcards
        .map((f) => ({ f, word: guessWord(f.term) }))
        .filter((x): x is { f: (typeof flashcards)[number]; word: string } => x.word !== null)
        .slice(0, ROUNDS),
    [flashcards],
  );
  const [idx, setIdx] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [wrong, setWrong] = useState(0);
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [won, setWon] = useState(false);
  const start = useRef(Date.now());
  const totalRef = useRef(score);

  if (rounds.length === 0) {
    return (
      <ModeFrame>
        <ModeHeader onClose={onClose} current={0} total={1} title="Begriffe-Raten" />
        <div className="grid flex-1 place-items-center px-6 text-center">
          <div>
            <h1 className="text-2xl">Dafür gibt es hier keine ratbaren Begriffe.</h1>
            <p className="mt-2 text-mute">Wähle ein anderes Kapitel oder „Alle Kapitel“.</p>
            <Button className="mt-5" onClick={onClose}>Zurück</Button>
          </div>
        </div>
      </ModeFrame>
    );
  }

  const { f, word } = rounds[idx];
  const need = lettersOf(word);
  const done = res !== null;
  const lives = LIVES - wrong;
  const solved = need.every((c) => guessed.includes(c));

  const finishRound = (ok: boolean, newGuessed: string[]) => {
    const r = onAnswer({ itemId: f.id, correct: ok, timeMs: Date.now() - start.current });
    totalRef.current = r.total;
    playSound(ok ? 'correct' : 'wrong');
    setGuessed(ok ? newGuessed : [...new Set([...newGuessed, ...need])]);
    setWon(ok);
    setRes(r);
  };

  const guess = (raw: string) => {
    const c = raw.toLowerCase();
    if (done || !KEYS.includes(c) || guessed.includes(c)) return;
    const ng = [...guessed, c];
    if (need.includes(c)) {
      setGuessed(ng);
      playSound('tap');
      if (need.every((x) => ng.includes(x))) finishRound(true, ng);
    } else {
      const w = wrong + 1;
      setGuessed(ng);
      setWrong(w);
      playSound('wrong');
      if (w >= LIVES) finishRound(false, ng);
    }
  };

  const tipp = () => {
    if (done || lives <= 1) return;
    const open = need.filter((c) => !guessed.includes(c));
    if (!open.length) return;
    const c = open[Math.floor(Math.random() * open.length)];
    const ng = [...guessed, c];
    setGuessed(ng);
    setWrong(wrong + 1);
    if (need.every((x) => ng.includes(x))) finishRound(true, ng);
  };

  const next = () => {
    if (idx + 1 >= rounds.length) return onFinish({ score: totalRef.current, maxScore: rounds.length * 100 });
    setIdx(idx + 1);
    setGuessed([]);
    setWrong(0);
    setRes(null);
    setWon(false);
    start.current = Date.now();
  };

  useKeys((e) => {
    if (e.key.length === 1 && isLetter(e.key)) guess(e.key);
  }, !done);

  return (
    <ModeFrame padBottom={done}>
      <ModeHeader onClose={onClose} current={idx + (done ? 1 : 0)} total={rounds.length} score={score} title="Begriffe-Raten" />
      <div className="flex flex-1 flex-col px-4 pb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest text-mute">WELCHER BEGRIFF IST GEMEINT?</span>
          <div className="flex gap-0.5" role="img" aria-label={`${lives} von ${LIVES} Leben`} data-testid="lives">
            {Array.from({ length: LIVES }, (_, i) => (
              <Icon key={i} name="heart" size={18} className={i < lives ? 'fill-bad text-bad' : 'text-line'} />
            ))}
          </div>
        </div>

        <p className="mt-3 rounded-2xl bg-card p-4 text-[17px] leading-relaxed" data-testid="clue">{maskDefinition(f.definition, f.term, word)}</p>

        {/* das gesuchte Wort */}
        <div className="mt-5 flex flex-wrap justify-center gap-x-1.5 gap-y-3" aria-label="Gesuchtes Wort" data-testid="word">
          {[...word].map((c, i) => {
            if (!isLetter(c)) return <span key={i} className="w-3 text-center text-2xl text-mute">{c === ' ' ? '' : c}</span>;
            const shown = guessed.includes(c.toLowerCase());
            return (
              <span
                key={i}
                data-letter={shown ? c : ''}
                className={`grid h-11 w-8 place-items-center border-b-4 font-display text-2xl ${shown ? (done && !won ? 'border-bad text-bad' : 'border-xp text-ink') : 'border-line text-transparent'}`}
              >
                {shown ? (c === 'ß' ? 'ß' : c.toUpperCase()) : '_'}
              </span>
            );
          })}
        </div>

        {/* Tastatur: 6 Spalten = große Tasten */}
        <div className="mx-auto mt-6 grid w-full max-w-md grid-cols-6 gap-1.5" role="group" aria-label="Buchstaben">
          {KEYS.map((k) => {
            const used = guessed.includes(k);
            const hit = used && need.includes(k);
            return (
              <button
                key={k}
                onClick={() => guess(k)}
                disabled={used || done}
                aria-label={k === 'ß' ? 'ß' : k.toUpperCase()}
                data-state={!used ? 'idle' : hit ? 'hit' : 'miss'}
                className={`tap rounded-xl border-2 font-display text-lg uppercase transition active:scale-95 ${
                  !used ? 'border-line bg-card-hi hover:border-p/70' : hit ? 'border-good bg-good/20 text-good' : 'border-bad/40 bg-bad/10 text-bad/60'
                }`}
              >
                {k === 'ß' ? 'ß' : k}
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-4 flex w-full max-w-md justify-between">
          <Button variant="secondary" onClick={tipp} disabled={done || lives <= 1} aria-label="Tipp: ein Buchstabe, kostet ein Leben">
            <Icon name="lightbulb" size={18} /> Tipp (−1 Leben)
          </Button>
          <p className="self-center text-xs text-mute">{solved ? '' : 'PC: einfach tippen'}</p>
        </div>
      </div>

      {done && res && (
        <FeedbackSheet
          correct={won}
          title={won ? `Richtig: ${f.term}` : `Gesucht war: ${f.term}`}
          points={res.points}
          text={f.definition}
          nextLabel={idx + 1 >= rounds.length ? 'Ergebnis ansehen' : 'Weiter'}
          onNext={next}
        />
      )}
    </ModeFrame>
  );
}
