import { gapsOf } from '@/content/parse';
import type { ContentItem, Flashcard } from '@/content/schema';

/** Kurzbeschreibung einer Aufgabe + richtige Lösung als Text (für „Das kannst du noch üben“) */
export function describeItem(item: ContentItem): { title: string; answer: string } {
  switch (item.type) {
    case 'mc':
      return { title: item.question, answer: item.options[item.correct] };
    case 'truefalse':
      return { title: item.statement, answer: item.correct ? 'Wahr' : 'Falsch' };
    case 'case':
      return { title: `${item.title}: ${item.question}`, answer: item.options[item.correct] };
    case 'sort':
      return {
        title: item.question,
        answer: item.categories
          .map((c) => `${c.label}: ${item.cards.filter((k) => k.category === c.id).map((k) => k.text).join(', ')}`)
          .join(' · '),
      };
    case 'pairs':
      return { title: item.question, answer: item.pairs.map((p) => `${p.left} = ${p.right}`).join(' · ') };
    case 'order':
      return { title: item.question, answer: item.steps.map((s, i) => `${i + 1}. ${s}`).join(' ') };
    case 'spot':
      return {
        title: item.title,
        answer: item.lines
          .filter((l) => l.error)
          .map((l) => `„${l.text}“ → ${l.fix ?? 'Fehler'}`)
          .join(' · '),
      };
    case 'cloze': {
      let i = 0;
      const gaps = gapsOf(item.text);
      const filled = item.text.replace(/\{\{(.+?)\}\}/g, () => `[${gaps[i++]}]`);
      return { title: 'Lückentext', answer: filled };
    }
  }
}

export const describeCard = (f: Flashcard): { title: string; answer: string } => ({ title: f.term, answer: f.definition });

/** Gesamter sichtbarer Text einer Aufgabe – Grundlage für „Begriff nachschlagen“ (Lücken bleiben leer) */
export function itemText(item: ContentItem): string {
  switch (item.type) {
    case 'mc':
      return [item.question, ...item.options].join(' \n ');
    case 'truefalse':
      return item.statement;
    case 'case':
      return [item.title, item.situation, item.question, ...item.options].join(' \n ');
    case 'sort':
      return [item.question, ...item.categories.map((c) => c.label), ...item.cards.map((c) => c.text)].join(' \n ');
    case 'pairs':
      return [item.question, ...item.pairs.flatMap((p) => [p.left, p.right])].join(' \n ');
    case 'order':
      return [item.question, ...item.steps].join(' \n ');
    case 'spot':
      return [item.title, item.intro, ...item.lines.map((l) => l.text)].join(' \n ');
    case 'cloze':
      return item.text.replace(/\{\{.+?\}\}/g, ' … ');
  }
}
