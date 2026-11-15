import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { guessWord, maskDefinition, lettersOf } from './words';
import { cards, makeProps } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));

describe('Begriffe-Raten – Wörter', () => {
  it('macht aus Lernkarten-Begriffen ratbare Wörter', () => {
    expect(guessWord('Versalie (Majuskel)')).toBe('Versalie');
    expect(guessWord('Ultraviolett (UV)')).toBe('Ultraviolett');
    expect(guessWord('Duales System')).toBe('Duales System');
    expect(guessWord('4/0 farbig')).toBeNull(); // Ziffern
    expect(guessWord('ppi (Pixel per inch)')).toBeNull(); // zu kurz
    expect(guessWord('Hochformat und Querformat und noch viel mehr')).toBeNull(); // zu lang
    expect(lettersOf('Duales System')).toEqual([...'dualessystem']);
  });
  it('verrät den Begriff nicht in der Definition', () => {
    expect(maskDefinition('Ein Versalie ist ein Großbuchstabe.', 'Versalie (Majuskel)', 'Versalie')).toBe('Ein ____ ist ein Großbuchstabe.');
    expect(maskDefinition('Das duale System teilt die Ausbildung.', 'Duales System', 'Duales System')).not.toMatch(/duale/i);
  });
});

describe('Begriffe-Raten – Spiel', () => {
  const list = () => cards(30, 0);
  const first = () => {
    const c = list().find((x) => guessWord(x.term))!;
    return { c, word: guessWord(c.term)! };
  };

  it('alle Buchstaben getroffen → richtig; Definition ist maskiert', async () => {
    const { c, word } = first();
    const { props, reports } = makeProps([], { flashcards: list() });
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByTestId('clue').textContent).not.toMatch(new RegExp(word.replace(/[^A-Za-zÄÖÜäöüß]/g, '').slice(0, 6), 'i'));
    for (const l of new Set(lettersOf(word))) await user.click(screen.getByRole('button', { name: l === 'ß' ? 'ß' : l.toUpperCase() }));
    expect(reports[0]).toMatchObject({ itemId: c.id, correct: true });
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
    expect(screen.getByText(new RegExp(`Richtig: ${c.term.replace(/[()]/g, '.')}`))).toBeInTheDocument();
  });

  it('sechs falsche Buchstaben → verloren, Wort wird gezeigt', async () => {
    const { c, word } = first();
    const { props, reports } = makeProps([], { flashcards: list() });
    const user = userEvent.setup();
    render(<Game {...props} />);
    const need = new Set(lettersOf(word));
    const wrong = [...'qxyjkwvzpf'].filter((k) => !need.has(k)).slice(0, 6);
    for (const k of wrong) await user.click(screen.getByRole('button', { name: k.toUpperCase() }));
    expect(reports[0]).toMatchObject({ itemId: c.id, correct: false });
    expect(screen.getByText(/Gesucht war/)).toBeInTheDocument();
  });

  it('Tipp deckt einen Buchstaben auf und kostet ein Leben', async () => {
    const { props } = makeProps([], { flashcards: list() });
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByTestId('lives')).toHaveAttribute('aria-label', '6 von 6 Leben');
    await user.click(screen.getByRole('button', { name: /Tipp/ }));
    expect(screen.getByTestId('lives')).toHaveAttribute('aria-label', '5 von 6 Leben');
    expect(document.querySelectorAll('[data-letter]:not([data-letter=""])').length).toBeGreaterThan(0);
  });

  it('Tastatur: Buchstabe tippen (PC)', async () => {
    const { props } = makeProps([], { flashcards: list() });
    const user = userEvent.setup();
    render(<Game {...props} />);
    const { word } = first();
    const l = lettersOf(word)[0];
    await user.keyboard(l);
    expect(screen.getByRole('button', { name: l === 'ß' ? 'ß' : l.toUpperCase() })).toBeDisabled();
  });
});
