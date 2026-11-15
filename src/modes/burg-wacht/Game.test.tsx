import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import Game from './Game';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

const all = () => [...pick('mc', 6, 1), ...pick('truefalse', 4, 1)];
type Q = ReturnType<typeof all>[number];
const text = (q: Q) => (q.type === 'mc' ? q.question : q.type === 'truefalse' ? q.statement : '');
const rightText = (q: Q) => (q.type === 'mc' ? q.options[q.correct] : q.type === 'truefalse' ? (q.correct ? 'Wahr' : 'Falsch') : '');
const run = (ms: number) => act(() => void vi.advanceTimersByTime(ms));
const current = (list: Q[]) => list.find((x) => screen.getByTestId('question').textContent!.endsWith(text(x)))!;
const answer = (list: Q[], right: boolean) => {
  const q = current(list);
  fireEvent.click(within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button').find((b) => b.textContent!.includes(rightText(q)) === right)!);
};

beforeEach(() => {
  useSettings.setState({ sound: false, relaxed: false });
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout', 'Date'] });
});
afterEach(() => vi.useRealTimers());

describe('Burg-Wacht', () => {
  it('startet mit voller Burg und ohne Baupunkte', () => {
    const { props } = makeProps(all());
    render(<Game {...props} />);
    expect(screen.getByTestId('field')).toBeInTheDocument();
    expect(screen.getByTestId('castle')).toHaveAttribute('aria-label', '5 von 5 Herzen');
    expect(screen.getByTestId('tokens')).toHaveTextContent('0');
  });

  it('richtige Antwort = +1 Baupunkt, falsche = keiner', () => {
    const list = all();
    const { props, reports } = makeProps(list);
    render(<Game {...props} />);
    answer(list, true);
    expect(reports[0].correct).toBe(true);
    expect(screen.getByTestId('tokens')).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: /Nächste Welle/ }));
    answer(list, false);
    expect(screen.getByTestId('tokens')).toHaveTextContent('1');
  });

  it('Taste Q baut einen Turm (kostet einen Baupunkt); ohne Baupunkt gibt es einen Hinweis', () => {
    const list = all();
    const { props } = makeProps(list);
    render(<Game {...props} />);
    fireEvent.keyDown(window, { key: 'q' });
    expect(screen.getByTestId('hint')).toHaveTextContent('keinen Baupunkt');
    answer(list, true);
    fireEvent.click(screen.getByRole('button', { name: /Nächste Welle/ }));
    fireEvent.keyDown(window, { key: 'q' });
    expect(screen.getByTestId('tokens')).toHaveTextContent('0');
  });

  it('ohne Türme/Antworten fällt die Burg → Niederlage und Ergebnis wird gemeldet', () => {
    const list = all();
    const { props, onFinish } = makeProps(list);
    render(<Game {...props} />);
    // Fragen falsch beantworten, Gegner laufen lassen
    for (let i = 0; i < 10 && !screen.queryByTestId('end'); i++) {
      if (screen.queryByTestId('question')) {
        answer(list, false);
        const n = screen.queryByRole('button', { name: /Nächste Welle|Zur letzten/ });
        if (n) fireEvent.click(n);
      }
      run(15000);
    }
    run(60000);
    expect(screen.getByTestId('end')).toHaveAttribute('data-result', 'lose');
    fireEvent.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
