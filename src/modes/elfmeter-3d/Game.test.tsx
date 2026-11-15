import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

const log = vi.hoisted(() => ({ calls: [] as string[], shots: [] as { idx: number; goal: boolean; keeper: number }[] }));
vi.mock('@/ui/game3d/webgl', async (orig) => ({ ...(await orig<typeof import('@/ui/game3d/webgl')>()), webglAvailable: () => true }));
vi.mock('./scene', () => ({
  PenaltyScene: class {
    reset(n: number) {
      log.calls.push(`reset${n}`);
    }
    pick() {
      return 0;
    }
    shoot(idx: number, _n: number, goal: boolean, keeper: number, done: () => void) {
      log.shots.push({ idx, goal, keeper });
      done();
    }
    update() {}
    resize() {}
    dispose() {
      log.calls.push('dispose');
    }
  },
}));
import Game from './Game';

const all = () => [...pick('mc', 8, 1), ...pick('truefalse', 4, 1)];
type Q = ReturnType<typeof all>[number];
const text = (q: Q) => (q.type === 'mc' ? q.question : q.type === 'truefalse' ? q.statement : '');
const rightText = (q: Q) => (q.type === 'mc' ? q.options[q.correct] : q.type === 'truefalse' ? (q.correct ? 'Wahr' : 'Falsch') : '');
const btns = () => within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button');
const cur = (l: Q[]) => l.find((x) => screen.getByTestId('question').textContent!.endsWith(text(x)))!;
const answer = (l: Q[], right: boolean) => fireEvent.click(btns().find((b) => b.textContent!.includes(rightText(cur(l))) === right)!);

beforeEach(() => {
  log.calls = [];
  log.shots = [];
  useSettings.setState({ sound: false, relaxed: false });
});

describe('Elfmeter 3D', () => {
  it('richtige Antwort = Tor (Torwart springt woanders hin), Zähler steigt', () => {
    const list = all();
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    answer(list, true);
    expect(reports[0].correct).toBe(true);
    expect(log.shots[0].goal).toBe(true);
    expect(log.shots[0].keeper).not.toBe(log.shots[0].idx);
    expect(screen.getByTestId('goals')).toHaveTextContent('1');
    expect(screen.getByText('TOOOR!')).toBeInTheDocument();
  });

  it('falsche Antwort = Torwart hält in dieselbe Ecke, kein Tor', () => {
    const list = all();
    const { props } = makeProps(list);
    render(<Game {...props} />);
    answer(list, false);
    expect(log.shots[0].goal).toBe(false);
    expect(log.shots[0].keeper).toBe(log.shots[0].idx);
    expect(screen.getByTestId('goals')).toHaveTextContent('0');
    expect(screen.getByText('Gehalten!')).toBeInTheDocument();
  });

  it('nächster Elfmeter setzt die Szene zurück; am Ende Ergebnis + Sieg ab 60 %', () => {
    const list = all();
    const { props, onFinish } = makeProps(list);
    const { unmount } = render(<Game {...props} />);
    for (let i = 0; i < list.length; i++) {
      answer(list, true);
      fireEvent.click(screen.getByRole('button', { name: /Nächster Elfmeter|^Weiter$/ }));
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'win');
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(log.calls.filter((c) => c.startsWith('reset')).length).toBeGreaterThan(list.length - 1);
    unmount();
    expect(log.calls).toContain('dispose');
  });

  it('nur falsche Antworten → Niederlage', () => {
    const list = all();
    const { props } = makeProps(list);
    render(<Game {...props} />);
    for (let i = 0; i < list.length; i++) {
      answer(list, false);
      fireEvent.click(screen.getByRole('button', { name: /Nächster Elfmeter|^Weiter$/ }));
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'lose');
  });
});
