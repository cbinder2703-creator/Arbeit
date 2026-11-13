// Reine Funktionen (ohne Vite-Abhängigkeit): rohes JSON → geprüfte Prüfung.
// Wird vom Loader (Browser) und von scripts/validate-content.ts (Node) benutzt.
import { chapterSchema, pruefungSchema, ITEM_TYPES } from './schema';
import type { Chapter, PruefungMeta } from './schema';
import { tokenize } from '@/engine/words';

export interface Pruefung {
  meta: PruefungMeta;
  chapters: Chapter[];
}

export interface ParseResult {
  pruefung: Pruefung | null;
  errors: string[];
  warnings: string[];
}

const GAP = /\{\{(.+?)\}\}/g;
export const gapsOf = (text: string): string[] => [...text.matchAll(GAP)].map((m) => m[1]);

function zodErrors(prefix: string, err: { issues: { path: (string | number)[]; message: string }[] }): string[] {
  return err.issues.map((i) => `${prefix}${i.path.length ? ' → ' + i.path.join('.') : ''}: ${i.message}`);
}

export function parsePruefung(
  folder: string,
  rawMeta: unknown,
  rawFiles: Record<string, unknown>,
): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const m = pruefungSchema.safeParse(rawMeta);
  if (!m.success) {
    return { pruefung: null, errors: zodErrors(`${folder}/pruefung.json`, m.error), warnings };
  }
  const meta = m.data;
  if (meta.id !== folder) errors.push(`${folder}/pruefung.json: id "${meta.id}" muss dem Ordnernamen "${folder}" entsprechen`);
  if (meta.examDate && Number.isNaN(Date.parse(meta.examDate))) {
    errors.push(`${folder}/pruefung.json: examDate "${meta.examDate}" ist kein gültiges Datum`);
  }

  const chapters: Chapter[] = [];
  for (const file of meta.chapters) {
    const raw = rawFiles[file];
    if (raw === undefined) {
      errors.push(`${folder}/pruefung.json: Kapiteldatei "${file}" fehlt im Ordner`);
      continue;
    }
    const c = chapterSchema.safeParse(raw);
    if (!c.success) {
      errors.push(...zodErrors(`${folder}/${file}`, c.error));
      continue;
    }
    chapters.push(c.data);
  }

  // --- inhaltliche Prüfungen ---
  const seen = new Map<string, string>();
  const claim = (itemId: string, where: string) => {
    const prev = seen.get(itemId);
    if (prev) errors.push(`${folder}: ID "${itemId}" doppelt (${prev} und ${where})`);
    else seen.set(itemId, where);
  };
  const chapterIds = new Set<string>();
  const allItems = chapters.flatMap((c) => c.items);

  for (const ch of chapters) {
    if (chapterIds.has(ch.id)) errors.push(`${folder}: Kapitel-ID "${ch.id}" doppelt`);
    chapterIds.add(ch.id);
    ch.flashcards.forEach((f) => claim(f.id, `${ch.id}/flashcards`));
    for (const it of ch.items) {
      const where = `${folder}/${ch.id}/${it.id}`;
      claim(it.id, ch.id);
      switch (it.type) {
        case 'mc':
        case 'case':
          if (it.correct >= it.options.length) errors.push(`${where}: correct=${it.correct} liegt außerhalb der ${it.options.length} Optionen`);
          if (new Set(it.options).size !== it.options.length) errors.push(`${where}: doppelte Antwortoptionen`);
          if (!it.explanation) warnings.push(`${where}: keine explanation`);
          break;
        case 'truefalse':
          if (!it.explanation) warnings.push(`${where}: keine explanation`);
          break;
        case 'sort': {
          const cats = new Set(it.categories.map((c) => c.id));
          for (const card of it.cards) {
            if (!cats.has(card.category)) errors.push(`${where}: Karte "${card.text}" nutzt unbekannte Kategorie "${card.category}"`);
          }
          for (const c of it.categories) {
            if (!it.cards.some((card) => card.category === c.id)) errors.push(`${where}: Kategorie "${c.id}" hat keine Karte`);
          }
          break;
        }
        case 'listen':
          if (it.correct >= it.options.length) errors.push(`${where}: correct=${it.correct} liegt außerhalb der ${it.options.length} Optionen`);
          if (new Set(it.options).size !== it.options.length) errors.push(`${where}: doppelte Antwortoptionen`);
          if (!it.options.includes(it.text)) warnings.push(`${where}: der vorgelesene Text steht nicht unter den Optionen`);
          break;
        case 'translate':
          if (tokenize(it.answer).length < 2) errors.push(`${where}: answer braucht mindestens zwei Wörter`);
          for (const a of it.alt) {
            const w = [...tokenize(it.answer), ...it.extra].map((x) => x.toLowerCase());
            for (const t of tokenize(a)) if (!w.includes(t.toLowerCase())) warnings.push(`${where}: alt "${a}" enthält Wort "${t}" nicht in der Wortauswahl`);
          }
          break;
        case 'cloze':
          if (gapsOf(it.text).length === 0) errors.push(`${where}: Text enthält keine Lücke {{…}}`);
          break;
        case 'spot':
          if (!it.lines.some((l) => l.error)) errors.push(`${where}: keine fehlerhafte Zeile`);
          for (const l of it.lines) if (l.error && !l.fix) warnings.push(`${where}: Fehlerzeile ohne "fix": "${l.text}"`);
          break;
        default:
          break;
      }
    }
  }

  // Lektionen: Aufgaben müssen existieren, IDs eindeutig
  const lessonIds = new Set<string>();
  for (const ch of chapters) {
    const inLesson = new Set<string>();
    for (const l of ch.lessons) {
      if (lessonIds.has(l.id)) errors.push(`${folder}: Lektions-ID "${l.id}" doppelt`);
      lessonIds.add(l.id);
      for (const itemId of l.items) {
        if (!ch.items.some((i) => i.id === itemId)) errors.push(`${folder}/${ch.id}: Lektion "${l.id}" verweist auf unbekannte Aufgabe "${itemId}" (muss im selben Kapitel stehen)`);
        inLesson.add(itemId);
      }
    }
    if (ch.lessons.length) for (const i of ch.items) if (!inLesson.has(i.id)) warnings.push(`${folder}/${ch.id}: Aufgabe "${i.id}" steckt in keiner Lektion`);
  }

  if (allItems.length === 0) errors.push(`${folder}: keine Aufgaben vorhanden`);

  for (const b of meta.badges) {
    const c = b.condition;
    if (c.kind === 'item' && !seen.has(c.itemId)) errors.push(`${folder}: Abzeichen "${b.id}" verweist auf unbekannte Aufgabe "${c.itemId}"`);
    if ((c.kind === 'typeCorrect' || c.kind === 'allOfType') && !(ITEM_TYPES as string[]).includes(c.type)) {
      errors.push(`${folder}: Abzeichen "${b.id}" nutzt unbekannten Typ "${c.type}"`);
    }
    if (c.kind === 'allOfType' && !allItems.some((i) => i.type === c.type)) {
      errors.push(`${folder}: Abzeichen "${b.id}" – es gibt keine Aufgaben vom Typ "${c.type}"`);
    }
    if (c.kind === 'typeCorrect' && allItems.filter((i) => i.type === c.type).length < c.count) {
      warnings.push(`${folder}: Abzeichen "${b.id}" ist unerreichbar (nur ${allItems.filter((i) => i.type === c.type).length} Aufgaben vom Typ ${c.type})`);
    }
  }
  const badgeIds = meta.badges.map((b) => b.id);
  if (new Set(badgeIds).size !== badgeIds.length) errors.push(`${folder}: Abzeichen-IDs doppelt`);

  if (meta.finalExam.questions > allItems.length) {
    warnings.push(`${folder}: finalExam.questions (${meta.finalExam.questions}) größer als Anzahl Aufgaben (${allItems.length})`);
  }

  return { pruefung: errors.length ? null : { meta, chapters }, errors, warnings };
}
