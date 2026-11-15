import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

const force = vi.hoisted(() => ({ rock: false, calls: [] as string[] }));
vi.mock('@/ui/game3d/webgl', async (orig) => ({ ...(await orig<typeof import('@/ui/game3d/webgl')>()), webglAvailable: () => true }));
vi.mock('./scene', () => ({
  SpaceScene: class {
    setFlight() {
      force.calls.push('flight');
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
vi.mock('@/engine/spaceRun', async (orig) => {
  const m = await orig<typeof import('@/engine/spaceRun')>();
  return {
    ...m,
    makeFlight: (...a: Parameters<typeof m.makeFlight>) => {
      const f = m.makeFlight(...a);
      f.rocks = force.rock ? [{ d: 6, x: 0, y: 0, r: 0.25, hit: false }] : [];
      return f;
    },
  };
});
import Game, { LIVES } from './Game';

const all = () => [...pick('mc', 8, 1), ...pick('truefalse', 4, 1)];
type Q = ReturnType<typeof all>[number];
const text = (q: Q) => (q.type === 'mc' ? q.question : q.type === 'truefalse' ? q.statement : '');
const rightText = (q: Q) => (q.type === 'mc' ? q.options[q.correct] : q.type === 'truefalse' ? (q.correct ? 'Wahr' : 'Falsch') : '');
const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const laneOfRight = (l: Q[]) => {
  const q = l.find((x) => screen.getByTestId('question').textContent!.endsWith(text(x)))!;
  return within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button').findIndex((b) => b.textContent!.includes(rightText(q)));
};

beforeEach(() => {
  force.rock = false;
  force.calls = [];
  useSettings.setState({ sound: false, relaxed: false });
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout', 'Date'] });
});
afterEach(() => vi.useRealTimers());

describe('Raumflug 3D', () => {
  it('baut die Szene auf und räumt sie wieder ab', () => {
    const { props } = makeProps(all());
    const { unmount } = render(<Game {...props} />);
    expect(screen.getByTestId('space')).toBeInTheDocument();
    expect(force.calls).toContain('flight');
    unmount();
    expect(force.calls).toContain('dispose');
  });

  it('zum richtigen Ring fliegen (Taste) → richtig', () => {
    const list = all();
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    fireEvent.keyDown(window, { key: String(laneOfRight(list) + 1) });
    run(10000);
    expect(reports[0].correct).toBe(true);
    expect(screen.getByRole('button', { name: /Weiterfliegen/ })).toBeInTheDocument();
  });

  it('falscher Ring kostet ein Herz', () => {
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

  it('Felsen auf dem Weg: Treffer kostet ein Herz', () => {
    force.rock = true;
    const { props } = makeProps(all());
    render(<Game {...props} />);
    run(1500);
    expect(screen.getByTestId('hearts')).toHaveAttribute('aria-label', `${LIVES - 1} von ${LIVES} Herzen`);
  });

  it('drei Treffer → Niederlage', () => {
    force.rock = true;
    const { props, onFinish } = makeProps(all());
    render(<Game {...props} />);
    for (let i = 0; i < 4 && !screen.queryByTestId('end'); i++) {
      run(12000);
      const b = screen.queryByRole('button', { name: /Weiterfliegen|^Weiter$/ });
      if (b) fireEvent.click(b);
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'lose');
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
