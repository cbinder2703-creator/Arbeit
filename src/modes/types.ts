import type { FC, LazyExoticComponent } from 'react';
import type { Charts, Checklist, ContentItem, Flashcard, ItemType, PruefungMeta } from '@/content/schema';
import type { AnswerReport, AnswerResult } from '@/engine/scoring';

export type { ItemType };

/** Kapitel-Angabe, die die Engine jeder Aufgabe mitgibt (für Chips wie „K2 · Ausbildungsvertrag“) */
export interface ChapterRef {
  id: string;
  number: number;
  title: string;
  color: string;
}

/** Aufgabe, wie sie ein Spielmodus bekommt: gemischt, mit Zusatzinfos der Engine */
export type PlayItem = ContentItem & {
  chapter?: ChapterRef;
  /** `order`: Schritte in gemischter Reihenfolge (die Lösung bleibt `steps`) */
  shuffledSteps?: string[];
  /** `cloze`: Wort-Chips (Lösungen + Ablenker, gemischt) */
  chips?: string[];
};

export interface ModeResult {
  score: number;
  maxScore: number;
  /** Bestwerte, bei denen weniger besser ist (z. B. Memory: Züge, Zeit) – werden pro Prüfung gespeichert */
  stats?: { key: string; value: number; label: string }[];
}

export interface ModeProps {
  pruefung: PruefungMeta; // für Thema/Farben
  items: PlayItem[]; // gefiltert + gemischt von der Engine
  flashcards?: Flashcard[];
  charts?: Charts;
  /** Vertrags-Checkliste des Kapitels (falls vorhanden) */
  checklist?: Checklist;
  /** aktueller Punktestand (Engine) */
  score: number;
  /** Antwort melden – die Engine vergibt Punkte, XP, Leitner-Box und liefert das Ergebnis zurück */
  onAnswer: (r: AnswerReport) => AnswerResult;
  onFinish: (s: ModeResult) => void;
  onClose: () => void;
  /** Abschlussprüfung: kein Feedback zwischendurch, Antwort nur festhalten, dann `onFinish` */
  exam?: { index: number; total: number };
}

export interface GameMode {
  id: string; // 'quiz-blitz'
  title: string; // 'Quiz-Blitz'
  tagline: string;
  icon: string; // lucide-Name
  color: string;
  accepts: ItemType[];
  usesFlashcards?: boolean;
  usesCharts?: boolean;
  minItems: number;
  sessionSize: number;
  /** wie viele Lernkarten die Engine mitgibt (Standard: sessionSize bei Lernkarten-Modi) */
  flashcardCount?: number;
  /** Reihenfolge in der Modus-Liste (klein = früher) */
  order?: number;
  /** ohne Punkte-/XP-Druck (z. B. Lernkarten) */
  noScore?: boolean;
  /** kann in der Abschlussprüfung eingesetzt werden (Prop `exam`) */
  supportsExam?: boolean;
  Component: LazyExoticComponent<FC<ModeProps>>;
}
