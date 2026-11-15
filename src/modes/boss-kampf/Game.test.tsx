import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game, { bossLife } from './Game';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false, relaxed: true }));
const all = () => [...pick('mc', 8, 1), ...pick('truefalse', 4, 1)];
type Q = ReturnType<typeof all>[number];
const correctIdx = (q: Q) => (q.type === 'mc' ? q.correct : q.type === 'truefalse' ? (q.correct ? 0 : 1) : -1);
const text = (q: Q) => (q.type === 'mc' ? q.question : q.type === 'truefalse' ? q.statement : '');
const now = (list: Q[]) => list.find((q) => screen.getByTestId('question').textContent!.endsWith(text(q)))!;
const buttons = () => within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button');

describe('Boss-Kampf', () => {
  it('Boss-Leben: n − 2 Treffer (bei 3 Herzen)', () => {
    expect(bossLife(12)).toBe(10);
    expect(bossLife(8)).toBe(6);
  });

  it('richtige Antwort = Treffer (Boss −1), falsche = ein Herz weniger', async () => {
    const list = all();
    const { props, reports } = makeProps(list);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByTestId('boss-hp')).toHaveTextContent('10/10');
    await user.click(buttons()[correctIdx(now(list))]);
    expect(screen.getByTestId('boss-hp')).toHaveTextContent('9/10');
    expect(reports[0].correct).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    const q = now(list);
    await user.click(buttons()[correctIdx(q) === 0 ? 1 : 0]);
    expect(screen.getByTestId('hearts')).toHaveAttribute('aria-label', '2 von 3 Herzen');
    expect(screen.getByTestId('boss-hp')).toHaveTextContent('9/10');
  });

  it('drei Fehler → Niederlage', async () => {
    const list = all();
    const { props, onFinish } = makeProps(list);
    const user = userEvent.setup();
    render(<Game {...props} />);
    for (let i = 0; i < 3; i++) {
      const q = now(list);
      await user.click(buttons()[correctIdx(q) === 0 ? 1 : 0]);
      await user.click(screen.getByRole('button', { name: /Weiter/ }));
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'lose');
    await user.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('alle Treffer → Sieg (nach n − 2 richtigen Antworten)', async () => {
    const list = all();
    const { props } = makeProps(list);
    const user = userEvent.setup();
    render(<Game {...props} />);
    for (let i = 0; i < 10; i++) {
      await user.click(buttons()[correctIdx(now(list))]);
      await user.click(screen.getByRole('button', { name: /Weiter|Sieg ansehen/ }));
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'win');
  });
});
