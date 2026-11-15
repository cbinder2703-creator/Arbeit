import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

const log = vi.hoisted(() => ({ calls: [] as string[] }));
vi.mock('@/ui/game3d/webgl', async (orig) => ({ ...(await orig<typeof import('@/ui/game3d/webgl')>()), webglAvailable: () => true }));
vi.mock('./scene', () => ({
  TowerScene: class {
    addBlock(done: () => void) {
      log.calls.push('add');
      done();
    }
    collapse(done: () => void) {
      log.calls.push('collapse');
      done();
    }
    update() {}
    resize() {}
    dispose() {
      log.calls.push('dispose');
    }
  },
}));
import Game, { LIVES } from './Game';

const all = () => [...pick('mc', 8, 1), ...pick('truefalse', 4, 1)];
type Q = ReturnType<typeof all>[number];
const text = (q: Q) => (q.type === 'mc' ? q.question : q.type === 'truefalse' ? q.statement : '');
const rightText = (q: Q) => (q.type === 'mc' ? q.options[q.correct] : q.type === 'truefalse' ? (q.correct ? 'Wahr' : 'Falsch') : '');
const btns = () => within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button');
const cur = (l: Q[]) => l.find((x) => screen.getByTestId('question').textContent!.endsWith(text(x)))!;
const answer = (l: Q[], right: boolean) => fireEvent.click(btns().find((b) => b.textContent!.includes(rightText(cur(l))) === right)!);
const nextBtn = () => screen.getByRole('button', { name: /Weiterbauen|^Weiter$/ });

beforeEach(() => {
  log.calls = [];
  useSettings.setState({ sound: false, relaxed: false });
});

describe('Turmbau 3D', () => {
  it('richtig → Block drauf, Höhe steigt', () => {
    const list = all();
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    answer(list, true);
    expect(log.calls).toContain('add');
    expect(reports[0].correct).toBe(true);
    expect(screen.getByTestId('height')).toHaveTextContent('1');
    expect(screen.getByText('Block sitzt! +1')).toBeInTheDocument();
  });

  it('falsch → Turm wackelt, ein Herz weniger, Höhe sinkt (nie unter 0)', () => {
    const list = all();
    const { props } = makeProps(list);
    render(<Game {...props} />);
    answer(list, false);
    expect(log.calls).toContain('collapse');
    expect(screen.getByTestId('height')).toHaveTextContent('0');
    expect(screen.getByTestId('hearts')).toHaveAttribute('aria-label', `${LIVES - 1} von ${LIVES} Herzen`);
    fireEvent.click(nextBtn());
    answer(list, true);
    answer(list, true); // gesperrt: zweite Antwort zählt nicht
    expect(screen.getByTestId('height')).toHaveTextContent('1');
  });

  it('alles richtig → Turm so hoch wie Fragen, Sieg und Ergebnis', () => {
    const list = all();
    const { props, onFinish } = makeProps(list);
    render(<Game {...props} />);
    for (let i = 0; i < list.length; i++) {
      answer(list, true);
      fireEvent.click(nextBtn());
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'win');
    expect(screen.getByText(new RegExp(`${list.length} Blöcke hoch`))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('drei Fehler → Niederlage', () => {
    const list = all();
    const { props } = makeProps(list);
    const { unmount } = render(<Game {...props} />);
    for (let i = 0; i < 3; i++) {
      answer(list, false);
      fireEvent.click(nextBtn());
    }
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'lose');
    unmount();
    expect(log.calls).toContain('dispose');
  });
});
