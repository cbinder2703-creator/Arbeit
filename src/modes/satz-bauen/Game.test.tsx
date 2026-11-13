import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { makeProps } from '@/test/harness';
import { play, translate1, translate2 } from '@/test/english';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));
const bank = () => screen.getByRole('group', { name: 'Wörter zur Auswahl' });
const tap = async (user: ReturnType<typeof userEvent.setup>, w: string) => {
  const b = Array.from(bank().querySelectorAll('button')).find((x) => x.textContent === w && !x.hasAttribute('disabled'))!;
  await user.click(b);
};

describe('Satz bauen', () => {
  it('Wörter antippen → richtiger Satz wird erkannt (auch ohne Satzzeichen/Groß-Kleinschreibung)', async () => {
    const { props, reports } = makeProps([play(translate1)]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByTestId('prompt')).toHaveTextContent('Könnte ich bitte die Rechnung haben?');
    for (const w of ['Could', 'I', 'have', 'the', 'bill', 'please']) await tap(user, w);
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(reports[0].correct).toBe(true);
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
  });

  it('Alternative Wortreihenfolge aus `alt` ist auch richtig', async () => {
    const { props, reports } = makeProps([play(translate1)]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    for (const w of ['please', 'could', 'I', 'have', 'the', 'bill']) await tap(user, w.charAt(0).toUpperCase() === w.charAt(0) ? w : Array.from(bank().querySelectorAll('button')).map((b) => b.textContent!).find((t) => t.toLowerCase() === w)!);
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(reports[0].correct).toBe(true);
  });

  it('falsche Reihenfolge → falsch, Lösung wird gezeigt; Wort antippen nimmt es zurück', async () => {
    const { props, reports } = makeProps([play(translate2), play(translate1)]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await tap(user, 'room.'.replace('.', '') );
    await user.click(screen.getByRole('button', { name: 'room (entfernen)' })); // zurücknehmen
    expect(screen.getByTestId('answer-line')).toHaveTextContent('Tippe die Wörter');
    for (const w of ['a', "I've", 'booked', 'room']) await tap(user, w);
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(reports[0].correct).toBe(false);
    expect(screen.getByText(/Fast – so geht der Satz/)).toBeInTheDocument();
    expect(screen.getAllByText(/I've booked a room\./).length).toBeGreaterThan(0);
  });

  it('Prüfen ist erst mit mindestens einem Wort aktiv; Abschlussprüfung ohne Feedback', async () => {
    const { props, reports, onFinish } = makeProps([play(translate2)], { exam: { index: 1, total: 20 } });
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByRole('button', { name: 'Weiter' })).toBeDisabled();
    await tap(user, "I've");
    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(reports).toHaveLength(1);
    expect(screen.queryByTestId('feedback')).toBeNull();
    expect(onFinish).toHaveBeenCalled();
  });
});
