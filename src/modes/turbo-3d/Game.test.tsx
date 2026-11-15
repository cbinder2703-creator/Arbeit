import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

const force = vi.hoisted(() => ({ obstacle: false, calls: [] as string[] }));
// Ohne echtes WebGL: die Szene wird durch eine Attrappe ersetzt, die nur mitschreibt
vi.mock('./scene', () => ({
  webglAvailable: () => true,
  RaceScene: class {
    setRound() {
      force.calls.push('round');
    }
    update() {}
    hit() {
      force.calls.push('hit');
    }
    resize() {}
    dispose() {
      force.calls.push('dispose');
    }
  },
}));
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
type Q = ReturnType<typeof all>[number];
const text = (q: Q) => (q.type === 'mc' ? q.question : q.type === 'truefalse' ? q.statement : '');
const rightText = (q: Q) => (q.type === 'mc' ? q.options[q.correct] : q.type === 'truefalse' ? (q.correct ? 'Wahr' : 'Falsch') : '');
const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const laneOfRight = (list: Q[]) => {
  const q = list.find((x) => screen.getByTestId('question').textContent!.endsWith(text(x)))!;
  const btns = within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button');
  return btns.findIndex((b) => b.textContent!.includes(rightText(q)));
};

beforeEach(() => {
  force.obstacle = false;
  force.calls = [];
  useSettings.setState({ sound: false, relaxed: false });
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout', 'Date'] });
});
afterEach(() => vi.useRealTimers());

describe('Turbo-Rennen 3D', () => {
  it('baut die Szene auf, räumt sie beim Verlassen wieder ab', () => {
    const { props } = makeProps(all());
    const { unmount } = render(<Game {...props} />);
    expect(screen.getByTestId('race')).toBeInTheDocument();
    expect(force.calls).toContain('round');
    unmount();
    expect(force.calls).toContain('dispose');
  });

  it('richtige Spur beim Tor = richtig; neue Frage baut eine neue Straße', () => {
    const list = all();
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    fireEvent.keyDown(window, { key: String(laneOfRight(list) + 1) });
    run(10000);
    expect(reports[0].correct).toBe(true);
    const rounds = force.calls.filter((c) => c === 'round').length;
    fireEvent.click(screen.getByRole('button', { name: /Weiterfahren/ }));
    expect(force.calls.filter((c) => c === 'round').length).toBeGreaterThan(rounds);
  });

  it('falsches Tor = ein Herz weniger, Szene bekommt einen Stoß', () => {
    const list = all();
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    const right = laneOfRight(list);
    fireEvent.keyDown(window, { key: String(right === 0 ? 2 : 1) });
    run(10000);
    expect(reports[0].correct).toBe(false);
    expect(screen.getByTestId('hearts')).toHaveAttribute('aria-label', `${LIVES - 1} von ${LIVES} Herzen`);
    expect(force.calls).toContain('hit');
  });

  it('drei Crashs → Spiel vorbei', () => {
    force.obstacle = true;
    const { props, onFinish } = makeProps(all());
    render(<Game {...props} />);
    for (let i = 0; i < 4 && !screen.queryByTestId('end'); i++) {
      run(12000);
      const b = screen.queryByRole('button', { name: /Weiterfahren|Weiter$/ });
      if (b) fireEvent.click(b);
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'lose');
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
