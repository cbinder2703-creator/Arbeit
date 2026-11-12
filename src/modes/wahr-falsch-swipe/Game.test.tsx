import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ blitz: false, sound: false }));

describe('Wahr oder Falsch?', () => {
  it('Buttons: eine richtige und eine falsche Antwort, dann Ergebnis', async () => {
    const items = pick('truefalse', 2);
    const { props, reports, onFinish } = makeProps(items);
    const user = userEvent.setup();
    render(<Game {...props} />);

    const t1 = (items[0] as { correct: boolean }).correct;
    await user.click(screen.getByRole('button', { name: t1 ? /Wahr/ : /Falsch/ }));
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
    await user.click(screen.getByRole('button', { name: 'Weiter' }));

    const t2 = (items[1] as { correct: boolean }).correct;
    await user.click(screen.getByRole('button', { name: t2 ? /Falsch/ : /Wahr/ }));
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'false');
    await user.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));

    expect(reports.map((r) => r.correct)).toEqual([true, false]);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('Pfeiltasten: → = wahr, ← = falsch', async () => {
    const items = pick('truefalse', 1);
    const { props, reports } = makeProps(items);
    const user = userEvent.setup();
    render(<Game {...props} />);
    const t = (items[0] as { correct: boolean }).correct;
    await user.keyboard(t ? '{ArrowRight}' : '{ArrowLeft}');
    expect(reports[0].correct).toBe(true);
  });

  it('zeigt Zusatzinfo bei Combo nicht zu früh und zählt nur einmal pro Karte', async () => {
    const { props, reports } = makeProps(pick('truefalse', 3));
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowLeft}');
    expect(reports).toHaveLength(1);
  });
});
