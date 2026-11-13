// zod-Schema für alle Inhalte (pruefung.json + Kapitel). Wird vom Loader UND von
// scripts/validate-content.ts benutzt.
import { z } from 'zod';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Farbe als #RRGGBB');
const id = z.string().min(1);

// ---------- Aufgaben-Typen ----------
const base = {
  id,
  difficulty: z.number().int().min(1).max(3),
  source: z.string().optional(),
  explanation: z.string().optional(),
  law: z.string().optional(),
};

export const mcSchema = z.object({
  ...base,
  type: z.literal('mc'),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correct: z.number().int().min(0),
});

export const truefalseSchema = z.object({
  ...base,
  type: z.literal('truefalse'),
  statement: z.string().min(1),
  correct: z.boolean(),
});

export const sortSchema = z.object({
  ...base,
  type: z.literal('sort'),
  question: z.string().min(1),
  categories: z.array(z.object({ id, label: z.string().min(1) })).min(2).max(4),
  cards: z.array(z.object({ text: z.string().min(1), category: id })).min(2),
});

export const pairsSchema = z.object({
  ...base,
  type: z.literal('pairs'),
  question: z.string().min(1),
  pairs: z.array(z.object({ left: z.string().min(1), right: z.string().min(1) })).min(2),
});

export const orderSchema = z.object({
  ...base,
  type: z.literal('order'),
  question: z.string().min(1),
  steps: z.array(z.string().min(1)).min(2),
});

export const caseSchema = z.object({
  ...base,
  type: z.literal('case'),
  title: z.string().min(1),
  situation: z.string().min(1),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correct: z.number().int().min(0),
});

export const spotSchema = z.object({
  ...base,
  type: z.literal('spot'),
  title: z.string().min(1),
  intro: z.string().min(1),
  lines: z
    .array(z.object({ text: z.string().min(1), error: z.boolean(), fix: z.string().optional() }))
    .min(2),
});

export const clozeSchema = z.object({
  ...base,
  type: z.literal('cloze'),
  text: z.string().min(1),
  distractors: z.array(z.string().min(1)).default([]),
});

/** Übersetzen durch Wörter antippen (Satz bauen): `answer` ist die Lösung, `alt` weitere richtige Sätze */
export const translateSchema = z.object({
  ...base,
  type: z.literal('translate'),
  prompt: z.string().min(1),
  answer: z.string().min(1),
  alt: z.array(z.string().min(1)).default([]),
  /** zusätzliche falsche Wörter in der Wortauswahl */
  extra: z.array(z.string().min(1)).default([]),
  /** Sprache des Satzes zum Vorlesen/Anzeigen der Lösung (nur Info) */
  hint: z.string().optional(),
});

/** Hören: `text` wird vorgelesen, gewählt wird der gehörte Satz */
export const listenSchema = z.object({
  ...base,
  type: z.literal('listen'),
  text: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correct: z.number().int().min(0),
  translation: z.string().optional(),
});

/** Sprechen: `text` laut nachsprechen */
export const speakSchema = z.object({
  ...base,
  type: z.literal('speak'),
  text: z.string().min(1),
  translation: z.string().optional(),
});

export const itemSchema = z.discriminatedUnion('type', [
  mcSchema,
  truefalseSchema,
  sortSchema,
  pairsSchema,
  orderSchema,
  caseSchema,
  spotSchema,
  clozeSchema,
  translateSchema,
  listenSchema,
  speakSchema,
]);

export const flashcardSchema = z.object({ id, term: z.string().min(1), definition: z.string().min(1) });

// ---------- Diagramme (Höher oder tiefer?) ----------
const curvePoints = z.array(z.tuple([z.union([z.number(), z.string()]), z.number()])).min(2);
const valueList = z.array(z.tuple([z.string(), z.number()])).min(2);
export const chartSchema = z.object({
  title: z.string().min(1),
  unit: z.string().optional(),
  source: z.string().optional(),
  points: curvePoints.optional(),
  values: valueList.optional(),
});
export const chartsSchema = z.record(z.union([chartSchema, z.string()]));

// ---------- Lektionen (Lernpfad) ----------
export const grammarSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  examples: z.array(z.object({ en: z.string().min(1), de: z.string().min(1) })).default([]),
});

export const lessonSchema = z.object({
  id,
  title: z.string().min(1),
  subtitle: z.string().default(''),
  icon: z.string().default('star'),
  /** Kurze Erklärung vor der Lektion */
  grammar: grammarSchema.optional(),
  /** IDs der Aufgaben dieser Lektion in Reihenfolge */
  items: z.array(id).min(1),
});

// ---------- Kapitel ----------
export const chapterSchema = z.object({
  id,
  chapter: z.number().int().min(1),
  title: z.string().min(1),
  subtitle: z.string().default(''),
  pages: z.string().default(''),
  color: hexColor,
  icon: z.string().default('book-open'),
  flashcards: z.array(flashcardSchema).default([]),
  items: z.array(itemSchema).default([]),
  charts: chartsSchema.optional(),
  contractChecklist: z.object({ title: z.string(), entries: z.array(z.string()) }).optional(),
  lessons: z.array(lessonSchema).default([]),
});

// ---------- Prüfung ----------
export const badgeConditionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('typeCorrect'), type: z.string(), count: z.number().int().min(1) }),
  z.object({ kind: z.literal('allOfType'), type: z.string() }),
  z.object({ kind: z.literal('item'), itemId: id }),
  z.object({ kind: z.literal('finalGrade'), maxGrade: z.number().int().min(1).max(6) }),
  z.object({ kind: z.literal('level'), level: z.number().int().min(2) }),
  z.object({ kind: z.literal('streak'), days: z.number().int().min(2) }),
  z.object({ kind: z.literal('lessonsDone'), count: z.number().int().min(1) }),
]);

export const badgeSchema = z.object({
  id,
  title: z.string().min(1),
  rule: z.string().min(1),
  /** Maschinenlesbare Form der Regel (wird von der Engine ausgewertet) */
  condition: badgeConditionSchema,
});

export const pruefungSchema = z.object({
  id,
  title: z.string().min(1),
  gameTitle: z.string().min(1),
  tagline: z.string().default(''),
  subject: z.string().default(''),
  pages: z.string().default(''),
  examDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum als JJJJ-MM-TT')
    .nullable(),
  color: hexColor,
  accent: hexColor,
  icon: z.string().default('book-open'),
  theme: z.string().default('standard'),
  /** Sprache zum Vorlesen/Sprechen (z. B. Englisch): zeigt 🔊 bei Begriffen und Lösungen */
  speech: z.object({ lang: z.string().default('en-GB'), rate: z.number().min(0.5).max(1.5).default(0.95) }).optional(),
  chapters: z.array(z.string().endsWith('.json')).min(1),
  modes: z.union([z.literal('auto'), z.array(z.string())]).default('auto'),
  finalExam: z.object({
    title: z.string().default('Abschlussprüfung'),
    questions: z.number().int().min(1).default(20),
    unlockAtPercent: z.number().min(0).max(100).default(60),
  }),
  badges: z.array(badgeSchema).default([]),
});

export type MCItem = z.infer<typeof mcSchema>;
export type TrueFalseItem = z.infer<typeof truefalseSchema>;
export type SortItem = z.infer<typeof sortSchema>;
export type PairsItem = z.infer<typeof pairsSchema>;
export type OrderItem = z.infer<typeof orderSchema>;
export type CaseItem = z.infer<typeof caseSchema>;
export type SpotItem = z.infer<typeof spotSchema>;
export type ClozeItem = z.infer<typeof clozeSchema>;
export type TranslateItem = z.infer<typeof translateSchema>;
export type ListenItem = z.infer<typeof listenSchema>;
export type SpeakItem = z.infer<typeof speakSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type ContentItem = z.infer<typeof itemSchema>;
export type ItemType = ContentItem['type'];
export type Flashcard = z.infer<typeof flashcardSchema>;
export type Chapter = z.infer<typeof chapterSchema>;
export type PruefungMeta = z.infer<typeof pruefungSchema>;
export type BadgeDef = z.infer<typeof badgeSchema>;
export type BadgeCondition = z.infer<typeof badgeConditionSchema>;
export type Charts = NonNullable<Chapter['charts']>;
export type Checklist = NonNullable<Chapter['contractChecklist']>;
export type ChartData = z.infer<typeof chartSchema>;

export const ITEM_TYPES: ItemType[] = ['mc', 'truefalse', 'sort', 'pairs', 'order', 'case', 'spot', 'cloze', 'translate', 'listen', 'speak'];
