import { Suspense } from 'react';
import { useState } from 'react';
import type { PlayItem, GameMode } from '@/modes/types';
import { usePruefung } from '@/app/pruefungContext';
import { allModes } from '@/modes/registry';
import type { AnswerReport, AnswerResult } from '@/engine/scoring';
import { SequenceContext } from './sequence';

/** Spielmodus, der eine Aufgabe dieses Typs zeigen kann (Abschlussprüfung und „Fehler üben“) */
export const modeForType = (type: PlayItem['type']): GameMode | undefined =>
  allModes.find((m) => m.supportsExam && m.accepts.includes(type)) ?? allModes.find((m) => m.accepts.includes(type));

/** Zeigt Aufgaben nacheinander, jede mit dem passenden Spielmodus. `exam` = ohne Feedback. */
export function ItemSequence({
  items,
  exam,
  score,
  onAnswer,
  onDone,
  onClose,
  lastLabel,
}: {
  items: PlayItem[];
  exam: boolean;
  score: number;
  onAnswer: (r: AnswerReport) => AnswerResult;
  onDone: () => void;
  onClose: () => void;
  /** Beschriftung nach der letzten Aufgabe (Standard „Ergebnis ansehen“) */
  lastLabel?: string;
}) {
  const pr = usePruefung();
  const [idx, setIdx] = useState(0);
  const item = items[idx];
  const mode = modeForType(item.type);
  if (!mode) return null;
  const Game = mode.Component;
  return (
    <Suspense fallback={<div className="grid min-h-dvh place-items-center text-mute">Lädt …</div>}>
      <SequenceContext.Provider value={{ index: idx + 1, total: items.length, lastLabel: idx + 1 >= items.length ? (lastLabel ?? 'Ergebnis ansehen') : 'Weiter' }}>
      <Game
        key={`${idx}-${item.id}`}
        pruefung={pr.meta}
        items={[item]}
        flashcards={[]}
        score={score}
        exam={exam ? { index: idx + 1, total: items.length } : undefined}
        onAnswer={onAnswer}
        onFinish={() => (idx + 1 >= items.length ? onDone() : setIdx(idx + 1))}
        onClose={onClose}
      />
      </SequenceContext.Provider>
    </Suspense>
  );
}
