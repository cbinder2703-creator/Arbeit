import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { esc, makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));
type Case = Extract<ReturnType<typeof pick>[0], { type: 'case' }>;

describe('Kündigungs-Gericht', () => {
  it('richtiges Urteil → Stempel „Urteil bestätigt“, Paragraf; falsches → „Revision“', async () => {
    const items = pick('case', 2, 1);
    const { props, reports, onFinish } = makeProps(items);
    const user = userEvent.setup();
    render(<Game {...props} />);

    const c1 = items[0] as Case;
    await user.click(screen.getByRole('radio', { name: new RegExp(esc(c1.options[c1.correct])) }));
    await user.click(screen.getByRole('button', { name: /Urteil sprechen/ }));
    expect(screen.getByTestId('stamp')).toHaveTextContent(/Urteil bestätigt/i);
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
    if (c1.law) expect(screen.getByText(c1.law)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Nächster Fall' }));

    const c2 = items[1] as Case;
    const wrongIdx = c2.correct === 0 ? 1 : 0;
    await user.click(screen.getByRole('radio', { name: new RegExp(esc(c2.options[wrongIdx])) }));
    await user.click(screen.getByRole('button', { name: /Urteil sprechen/ }));
    expect(screen.getByTestId('stamp')).toHaveTextContent(/Revision/i);
    await user.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));

    expect(reports.map((r) => r.correct)).toEqual([true, false]);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('„Urteil sprechen“ ist erst nach einer Auswahl aktiv; Zifferntasten + Enter (PC)', async () => {
    const items = pick('case', 1, 1);
    const { props, reports } = makeProps(items);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByRole('button', { name: /Urteil sprechen/ })).toBeDisabled();
    const c = items[0] as Case;
    await user.keyboard(String(c.correct + 1));
    await user.keyboard('{Enter}');
    expect(reports[0].correct).toBe(true);
  });
});
