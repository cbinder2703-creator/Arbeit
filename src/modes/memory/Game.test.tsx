import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import Game from './Game';
import { cards, makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => {
  useSettings.setState({ sound: false });
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const all = () => screen.getAllByRole('button').filter((b) => b.dataset.testid?.startsWith('card-'));
const byPair = () => {
  const m = new Map<string, HTMLElement[]>();
  all().forEach((b) => m.set(b.dataset.pair!, [...(m.get(b.dataset.pair!) ?? []), b]));
  return [...m.values()];
};

describe('Memory', () => {
  it('baut 6 Paare = 12 Karten (3 × 4 mobil / 4 × 3 Desktop)', () => {
    const { props } = makeProps(pick('pairs', 3, 0), { flashcards: cards(12) });
    render(<Game {...props} />);
    expect(all()).toHaveLength(12);
    expect(screen.getByRole('group', { name: 'Memory-Karten' }).className).toMatch(/grid-cols-3/);
    expect(screen.getByRole('group', { name: 'Memory-Karten' }).className).toMatch(/md:grid-cols-4/);
  });

  it('füllt mit kurzen Lernkarten auf, wenn die Aufgaben zu wenige Paare haben', () => {
    const { props } = makeProps(pick('pairs', 1, 1), { flashcards: cards(21, 1) }); // nur 5 Paare
    render(<Game {...props} />);
    expect(all()).toHaveLength(12);
  });

  it('falsches Paar dreht zurück, richtige Paare bleiben; am Ende Bestwerte + Aufgaben gemeldet', () => {
    const { props, reports, onFinish } = makeProps(pick('pairs', 3, 0), { flashcards: cards(12) });
    render(<Game {...props} />);
    const pairs = byPair();

    // Fehlzug: zwei Karten aus verschiedenen Paaren
    fireEvent.click(pairs[0][0]);
    fireEvent.click(pairs[1][0]);
    expect(pairs[0][0].dataset.state).toBe('up');
    act(() => void vi.advanceTimersByTime(1100));
    expect(pairs[0][0].dataset.state).toBe('down');

    // alle Paare finden
    for (const [a, b] of pairs) {
      fireEvent.click(a);
      fireEvent.click(b);
      act(() => void vi.advanceTimersByTime(500));
      expect(a.dataset.state).toBe('matched');
    }
    act(() => void vi.advanceTimersByTime(1000));

    expect(onFinish).toHaveBeenCalledTimes(1);
    const arg = onFinish.mock.calls[0][0];
    expect(arg.stats[0]).toMatchObject({ key: 'zuege', value: 7 }); // 6 Treffer + 1 Fehlzug
    expect(arg.stats[1].key).toBe('zeit');
    const sources = new Set(reports.map((r) => r.itemId));
    expect(sources.size).toBe(reports.length); // jede Quelle genau einmal
    expect(reports.some((r) => !r.correct)).toBe(true); // die Quelle des Fehlzugs
  });
});
