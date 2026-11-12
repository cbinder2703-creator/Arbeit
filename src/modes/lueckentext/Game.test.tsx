import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { esc, makeProps, pick } from '@/test/harness';
import { gapsOf } from '@/content/parse';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));
type Cloze = Extract<ReturnType<typeof pick>[0], { type: 'cloze' }>;
const chip = (w: string) => screen.getByRole('button', { name: new RegExp('^' + esc(w) + '$') });

describe('Lückentext', () => {
  it('Chips füllen die nächste freie Lücke, Lücke antippen gibt den Chip zurück', async () => {
    const item = pick('cloze', 1, 0)[0] as Cloze;
    const gaps = gapsOf(item.text);
    const { props } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByRole('button', { name: 'Prüfen' })).toBeDisabled();
    await user.click(chip(gaps[0]));
    expect(screen.getByTestId('gap-0')).toHaveTextContent(gaps[0]);
    expect(chip(gaps[0])).toBeDisabled();
    await user.click(screen.getByTestId('gap-0'));
    expect(screen.getByTestId('gap-0')).toHaveTextContent('…');
    expect(chip(gaps[0])).toBeEnabled();
  });

  it('alles richtig → grün; falsche Reihenfolge → rote Lücken', async () => {
    const item = pick('cloze', 1, 0)[0] as Cloze;
    const gaps = gapsOf(item.text);
    const { props, reports } = makeProps([item]);
    const user = userEvent.setup();
    const { unmount } = render(<Game {...props} />);
    for (const g of gaps) await user.click(chip(g));
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(reports[0]).toMatchObject({ correct: true, parts: { total: gaps.length, correct: gaps.length } });
    expect(screen.getByTestId('gap-0')).toHaveAttribute('data-state', 'right');
    unmount();

    const h = makeProps([item]);
    render(<Game {...h.props} />);
    for (const g of [...gaps].reverse()) await user.click(chip(g)); // vertauscht
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(h.reports[0].correct).toBe(false);
    expect(document.querySelector('[data-state="wrong"]')).not.toBeNull();
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'false');
  });

  it('„Berufsschule und Ausbildungsbetrieb“: vertauschte Reihenfolge ist auch richtig', async () => {
    const item = pick('cloze', 1, 0)[0] as Cloze; // k1-501
    const gaps = gapsOf(item.text);
    const { props, reports } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    for (const g of [gaps[1], gaps[0], gaps[2], gaps[3]]) await user.click(chip(g));
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(reports[0]).toMatchObject({ correct: true, parts: { total: 4, correct: 4 } });
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
  });
});
