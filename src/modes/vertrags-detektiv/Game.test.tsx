import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { esc, makeProps, pick, pruefung } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));
type Spot = Extract<ReturnType<typeof pick>[0], { type: 'spot' }>;
const line = (t: string) => screen.getByRole('button', { name: new RegExp('^\\d+' + esc(t.slice(0, 30))) });

describe('Vertrags-Detektiv', () => {
  it('alle Fehler gefunden, nichts zu Unrecht markiert → fehlerfrei', async () => {
    const item = pick('spot', 1, 1)[0] as Spot;
    const { props, reports, onFinish } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    for (const l of item.lines.filter((x) => x.error)) await user.click(line(l.text));
    await user.click(screen.getByRole('button', { name: /Prüfen/ }));
    const errs = item.lines.filter((l) => l.error).length;
    expect(reports[0]).toMatchObject({ correct: true, parts: { total: errs, correct: errs, errors: 0 } });
    expect(screen.getAllByText(/Richtig erkannt/).length).toBe(errs);
    await user.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalled();
  });

  it('übersehen + fälschlich markiert wird erkannt und gezeigt', async () => {
    const item = pick('spot', 1, 1)[0] as Spot;
    const { props, reports } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    const errors = item.lines.filter((l) => l.error);
    const fine = item.lines.find((l) => !l.error)!;
    await user.click(line(errors[0].text)); // ein Fehler gefunden, Rest übersehen
    await user.click(line(fine.text)); // und eine korrekte Zeile zu Unrecht
    await user.click(screen.getByRole('button', { name: /Prüfen/ }));
    expect(reports[0]).toMatchObject({ correct: false, parts: { total: errors.length, correct: 1, errors: 1 } });
    expect(screen.getAllByText(/Übersehen/).length).toBe(errors.length - 1);
    expect(screen.getByText(/Fälschlich markiert/)).toBeInTheDocument();
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'false');
  });

  it('Checkliste mit den 12 Mindestangaben', async () => {
    const checklist = pruefung.chapters[1].contractChecklist!;
    const { props } = makeProps(pick('spot', 1, 1), { checklist });
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.click(screen.getByRole('tab', { name: 'Checkliste' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(12);
    expect(screen.getByText(/Dauer des Urlaubs/)).toBeInTheDocument();
  });
});
