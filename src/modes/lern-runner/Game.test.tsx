import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

const force = vi.hoisted(() => ({ obstacle: false }));
vi.mock('@/engine/laneRun', async (orig) => {
  const m = await orig<typeof import('@/engine/laneRun')>();
  return {
    ...m,
    makeRound: (...a: Parameters<typeof m.makeRound>) => {
      const r = m.makeRound(...a);
      r.obstacles = force.obstacle ? [{ d: 6, lane: r.lane, hit: false }] : [];
      return r;
    },
  };
});
import Game, { LIVES } from './Game';

const all = () => [...pick('mc', 8, 1), ...pick('truefalse', 4, 1)];
const text = (q: ReturnType<typeof all>[number]) => (q.type === 'mc' ? q.question : q.type === 'truefalse' ? q.statement : '');
const correctOf = (q: ReturnType<typeof all>[number]) => (q.type === 'mc' ? q.correct : q.type === 'truefalse' ? (q.correct ? 0 : 1) : -1);
const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => {
  force.obstacle = false;
  useSettings.setState({ sound: false, relaxed: false });
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout', 'Date'] });
});
afterEach(() => vi.useRealTimers());

describe('Lern-Runner', () => {
  it('zeigt Frage, Spur-Antworten und startet in der mittleren Spur', () => {
    const { props } = makeProps(all());
    render(<Game {...props} />);
    expect(screen.getByTestId('runner')).toBeInTheDocument();
    const btns = within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button');
    expect(btns.length).toBeGreaterThanOrEqual(2);
    expect(btns.filter((b) => b.getAttribute('data-state') === 'selected')).toHaveLength(1);
  });

  it('Zahlentaste wählt die Spur; am Tor wird diese Antwort gewertet', () => {
    const list = all();
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    const q = list.find((x) => screen.getByTestId('question').textContent!.endsWith(text(x)))!;
    // Spur der richtigen Antwort finden: Antworten werden gekürzt → über den Text der Buttons
    const btns = within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button');
    const want = q.type === 'mc' ? q.options[q.correct] : correctOf(q) === 0 ? 'Wahr' : 'Falsch';
    const lane = btns.findIndex((b) => b.textContent!.includes(want));
    fireEvent.keyDown(window, { key: String(lane + 1) });
    run(9000);
    expect(reports).toHaveLength(1);
    expect(reports[0].correct).toBe(true);
    expect(screen.getByRole('button', { name: /Weiterlaufen/ })).toBeInTheDocument();
  });

  it('falsches Tor kostet ein Herz', () => {
    const list = all();
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    const q = list.find((x) => screen.getByTestId('question').textContent!.endsWith(text(x)))!;
    const btns = within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button');
    const want = q.type === 'mc' ? q.options[q.correct] : correctOf(q) === 0 ? 'Wahr' : 'Falsch';
    const right = btns.findIndex((b) => b.textContent!.includes(want));
    fireEvent.keyDown(window, { key: String(right === 0 ? 2 : 1) });
    run(9000);
    expect(reports[0].correct).toBe(false);
    expect(screen.getByTestId('hearts')).toHaveAttribute('aria-label', `${LIVES - 1} von ${LIVES} Herzen`);
  });

  it('ein Hindernis in der eigenen Spur kostet ein Herz', () => {
    force.obstacle = true;
    const { props } = makeProps(all());
    render(<Game {...props} />);
    run(1500);
    expect(screen.getByTestId('hearts')).toHaveAttribute('aria-label', `${LIVES - 1} von ${LIVES} Herzen`);
  });

  it('drei Treffer → Spiel vorbei, Ergebnis wird gemeldet', () => {
    force.obstacle = true;
    const { props, onFinish } = makeProps(all());
    render(<Game {...props} />);
    // je Runde ein Hindernis; nie ausweichen → Herzen weg
    for (let i = 0; i < 3 && !screen.queryByTestId('end'); i++) {
      run(9000);
      const next = screen.queryByRole('button', { name: /Weiterlaufen|Weiter$/ });
      if (next) fireEvent.click(next);
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'lose');
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
