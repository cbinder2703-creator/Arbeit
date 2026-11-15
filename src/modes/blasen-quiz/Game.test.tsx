import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game, { delayOf } from './Game';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false, relaxed: false }));
afterEach(() => vi.useRealTimers());
const list = () => [...pick('mc', 6, 1), ...pick('truefalse', 2, 1)];
type Q = ReturnType<typeof list>[number];
const correctIdx = (q: Q) => (q.type === 'mc' ? q.correct : q.type === 'truefalse' ? (q.correct ? 0 : 1) : -1);
const text = (q: Q) => (q.type === 'mc' ? q.question : q.type === 'truefalse' ? q.statement : '');
const now = (l: Q[]) => l.find((q) => screen.getByTestId('question').textContent!.endsWith(text(q)))!;
const bubble = (i: number) => document.querySelector(`[data-bubble="${i}"]`) as HTMLElement;

describe('Blasen-Quiz', () => {
  it('die zweite Blase jeder Spur startet später (keine Überlappung)', () => {
    expect(delayOf(0)).toBeLessThan(delayOf(2));
    expect(delayOf(2) - delayOf(0)).toBeGreaterThanOrEqual(4);
  });

  it('richtige Blase antippen → Treffer, Feedback; falsche → Leben weg', async () => {
    const l = list();
    const { props, reports } = makeProps(l);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByTestId('arena')).toBeInTheDocument();
    await user.click(bubble(correctIdx(now(l))));
    expect(reports[0].correct).toBe(true);
    expect(reports[0].timeLimitMs).toBeGreaterThan(10000);
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
    await user.click(screen.getByRole('button', { name: 'Nächste Blase' }));
    const q = now(l);
    await user.click(bubble(correctIdx(q) === 0 ? 1 : 0));
    expect(screen.getByTestId('lives')).toHaveAttribute('aria-label', '2 von 3 Leben');
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'false');
  });

  it('entwischt die richtige Blase, geht ein Leben verloren', async () => {
    vi.useFakeTimers();
    const l = list();
    const { props, reports } = makeProps(l);
    render(<Game {...props} />);
    const q = now(l);
    await act(async () => {
      await vi.advanceTimersByTimeAsync((delayOf(correctIdx(q)) + 13) * 1000 + 100);
    });
    expect(reports[0].correct).toBe(false);
    expect(screen.getByText('Die Blase ist entwischt!')).toBeInTheDocument();
    expect(screen.getByTestId('lives')).toHaveAttribute('aria-label', '2 von 3 Leben');
  });

  it('Zifferntasten wählen eine Blase', async () => {
    const l = list();
    const { props, reports } = makeProps(l);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.keyboard(String(correctIdx(now(l)) + 1));
    expect(reports[0].correct).toBe(true);
  });
});
