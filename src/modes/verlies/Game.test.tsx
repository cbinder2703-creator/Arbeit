import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

// Feste Karte: offener Raum, Start (1,8), Monster in Reihe 8 ab Spalte 3, Tor oben rechts (7,1)
vi.mock('./dungeon', async (orig) => {
  const m = await orig<typeof import('./dungeon')>();
  return {
    ...m,
    generateDungeon: (n: number): import('./dungeon').Dungeon => ({
      wall: Array.from({ length: m.ROWS }, (_, r) => Array.from({ length: m.COLS }, (_, c) => r === 0 || c === 0 || r === m.ROWS - 1 || c === m.COLS - 1)),
      start: { c: 1, r: m.ROWS - 2 },
      exit: { c: m.COLS - 2, r: 1 },
      monsters: Array.from({ length: n }, (_, i) => ({ c: 3 + i, r: m.ROWS - 2, kind: i, alive: true })),
      hearts: [],
    }),
  };
});
import Game from './Game';

beforeEach(() => useSettings.setState({ sound: false, relaxed: true }));
type Q = ReturnType<typeof pick>[number];
const text = (q: Q) => (q.type === 'mc' ? q.question : q.type === 'truefalse' ? q.statement : '');
const rightText = (q: Q) => (q.type === 'mc' ? q.options[q.correct] : q.type === 'truefalse' ? (q.correct ? 'Wahr' : 'Falsch') : '');
const key = (k: string, n = 1) => {
  for (let i = 0; i < n; i++) fireEvent.keyDown(window, { key: k });
};
const choices = () => within(screen.getByTestId('fight')).getAllByRole('button');
const current = (list: Q[]) => list.find((x) => screen.getByTestId('question').textContent!.endsWith(text(x)))!;
const answer = (list: Q[], right: boolean) => {
  const q = current(list);
  fireEvent.click(choices().find((b) => b.textContent!.includes(rightText(q)) === right)!);
};

describe('Verlies', () => {
  it('zeigt Karte, Herzen und Hinweis', () => {
    const { props } = makeProps(pick('mc', 8, 1));
    render(<Game {...props} />);
    expect(screen.getByTestId('dungeon')).toBeInTheDocument();
    expect(screen.getByTestId('hearts')).toHaveAttribute('aria-label', '3 von 3 Herzen');
    expect(screen.getByTestId('hint')).toHaveTextContent('Das Tor ist zu');
    expect(screen.getByText('0/7')).toBeInTheDocument(); // höchstens 7 Monster
  });

  it('Monster berühren → Frage; richtige Antwort besiegt es', () => {
    const list = pick('mc', 8, 1);
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    key('ArrowRight'); // (2,8)
    expect(screen.queryByTestId('fight')).toBeNull();
    key('ArrowRight'); // Monster auf (3,8)
    expect(screen.getByTestId('fight')).toBeInTheDocument();
    answer(list, true);
    expect(reports[0].correct).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Weiter im Verlies/ }));
    expect(screen.queryByTestId('fight')).toBeNull();
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('falsche Antwort: ein Herz weniger, Monster bleibt, die Frage kommt später wieder', () => {
    const list = pick('mc', 8, 1);
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    key('ArrowRight', 3);
    const first = current(list);
    answer(list, false);
    expect(screen.getByTestId('hearts')).toHaveAttribute('aria-label', '2 von 3 Herzen');
    fireEvent.click(screen.getByRole('button', { name: /Weiter im Verlies/ }));
    key('ArrowRight'); // Monster steht noch → wieder Kampf, mit der nächsten Frage
    expect(screen.getByTestId('fight')).toBeInTheDocument();
    expect(current(list).id).not.toBe(first.id);
    expect(reports).toHaveLength(1);
  });

  it('Tor ist zu, solange Monster leben; nach allen Siegen öffnet es → Sieg', () => {
    const list = pick('mc', 3, 1); // 3 Aufgaben → 3 Monster
    const { props, onFinish } = makeProps(list);
    render(<Game {...props} />);
    key('ArrowRight'); // (2,8)
    for (let i = 0; i < 3; i++) {
      key('ArrowRight');
      answer(list, true);
      fireEvent.click(screen.getByRole('button', { name: /Weiter im Verlies/ }));
    }
    expect(screen.getByTestId('hint')).toHaveTextContent('Alle Monster besiegt');
    key('ArrowRight', 2); // (5,8) → (7,8)
    key('ArrowUp', 7); // bis (7,1) = Tor
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'win');
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('Tor bei lebenden Monstern: Hinweis statt Sieg', () => {
    const { props } = makeProps(pick('mc', 8, 1));
    render(<Game {...props} />);
    key('ArrowUp', 7); // Spalte 1 hoch bis Reihe 1
    key('ArrowRight', 6); // bis (7,1) = Tor
    expect(screen.queryByTestId('end')).toBeNull();
    expect(screen.getByTestId('hint')).toHaveTextContent('verschlossen');
  });

  it('drei Fehler → Niederlage', () => {
    const list = pick('mc', 8, 1);
    const { props, onFinish } = makeProps(list);
    render(<Game {...props} />);
    key('ArrowRight', 3);
    for (let i = 0; i < 3; i++) {
      answer(list, false);
      fireEvent.click(screen.getByRole('button', { name: /Weiter/ }));
      if (i < 2) key('ArrowRight');
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'lose');
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
