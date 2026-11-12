import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from '@/modes/quiz-blitz/Game';
import { PruefungContext } from '@/app/pruefungContext';
import { findTerms, glossaryCards, searchCards } from '@/engine/glossary';
import { itemText } from '@/engine/describe';
import { makeProps, pruefung } from '@/test/harness';
import { prepareItem } from '@/engine/session';
import { mulberry32 } from '@/engine/shuffle';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ relaxed: true, sound: false }));
const cards = glossaryCards(pruefung);
const stufen = pruefung.chapters[0].items.find((i) => i.type === 'truefalse' && /Stufenausbildung/.test(i.statement))!;

describe('Begriffe zuordnen', () => {
  it('findet „Stufenausbildung“ aus dem Aufgabentext', () => {
    const r = findTerms(itemText(stufen), cards);
    expect(r.map((c) => c.term)).toContain('Stufenausbildung');
    expect(r[0].definition).toMatch(/Fachstufe I/);
  });
  it('erkennt Kürzel in Klammern (HwO, BBiG), aber keine Alltagswörter', () => {
    expect(findTerms('Welche Vorschrift gilt laut HwO?', cards).map((c) => c.term)).toContain('Handwerksordnung (HwO)');
    expect(findTerms('Die Qualität in allen Betrieben ist gleich.', cards)).toEqual([]);
  });
  it('Lücken bleiben im Text leer (keine Lösungen)', () => {
    const cloze = pruefung.chapters[0].items.find((i) => i.type === 'cloze')!;
    expect(itemText(cloze)).not.toMatch(/Berufsschule|\{\{/);
  });
  it('Suche im Glossar', () => {
    expect(searchCards('probezeit', cards).length).toBeGreaterThan(0);
    expect(searchCards('', cards)).toHaveLength(cards.length);
    expect(searchCards('xyzxyz', cards)).toEqual([]);
  });
});

const withContext = (ui: React.ReactElement) => render(<PruefungContext.Provider value={pruefung}>{ui}</PruefungContext.Provider>);

describe('Begriff?-Knopf im Spiel', () => {
  it('öffnet die Erklärung, Tasten gehen nicht durch, nach dem Schließen geht’s weiter', async () => {
    const item = prepareItem(stufen, pruefung.chapters[0], mulberry32(1));
    const { props, reports } = makeProps([item, item]);
    const user = userEvent.setup();
    withContext(<Game {...props} />);

    await user.click(screen.getByRole('button', { name: 'Begriff nachschlagen' }));
    const dialog = screen.getByRole('dialog', { name: 'Begriffe nachschlagen' });
    expect(within(dialog).getByText('Stufenausbildung')).toBeInTheDocument();
    expect(within(dialog).getByText(/Fachstufe I/)).toBeInTheDocument();

    await user.keyboard('1'); // Taste darf die Frage NICHT beantworten
    expect(reports).toHaveLength(0);

    await user.type(within(dialog).getByRole('searchbox', { name: 'Begriff suchen' }), 'Probezeit');
    expect(within(dialog).getAllByText(/Probezeit/).length).toBeGreaterThan(0);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.keyboard('1');
    expect(reports).toHaveLength(1);
  });

  it('in der Abschlussprüfung gibt es den Knopf nicht', () => {
    const item = prepareItem(stufen, pruefung.chapters[0], mulberry32(1));
    const { props } = makeProps([item], { exam: { index: 1, total: 20 } });
    withContext(<Game {...props} />);
    expect(screen.queryByRole('button', { name: 'Begriff nachschlagen' })).toBeNull();
  });

  it('ohne Prüfungs-Kontext (Einzeltest eines Modus) erscheint kein Knopf', () => {
    const item = prepareItem(stufen, pruefung.chapters[0], mulberry32(1));
    render(<Game {...makeProps([item]).props} />);
    expect(screen.queryByRole('button', { name: 'Begriff nachschlagen' })).toBeNull();
  });
});
