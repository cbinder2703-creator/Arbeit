import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ relaxed: true, sound: false }));

describe('Quiz-Blitz', () => {
  it('beantwortet eine Frage richtig und eine falsch, zeigt Feedback und beendet die Runde', async () => {
    const items = pick('mc', 2);
    const { props, reports, onFinish } = makeProps(items);
    const user = userEvent.setup();
    render(<Game {...props} />);

    // Frage 1: richtige Option anklicken
    const q1 = items[0] as Extract<typeof items[0], { type: 'mc' }>;
    await user.click(screen.getByRole('button', { name: new RegExp(q1.options[q1.correct].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }));
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
    expect(screen.getByText('Richtig!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Weiter' }));

    // Frage 2: falsche Option (per Taste 1/2 – die jeweils nicht richtige)
    const q2 = items[1] as Extract<typeof items[0], { type: 'mc' }>;
    await user.keyboard(q2.correct === 0 ? '2' : '1');
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'false');
    expect(screen.getByText('Leider falsch')).toBeInTheDocument();
    await user.keyboard('{Enter}');

    expect(reports.map((r) => r.correct)).toEqual([true, false]);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('Tasten 1–4 antworten, nur einmal pro Frage', async () => {
    const { props, reports } = makeProps(pick('mc', 2));
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.keyboard('1');
    await user.keyboard('2');
    expect(reports).toHaveLength(1);
  });

  it('Wahr/Falsch-Aufgaben erscheinen mit zwei Buttons', async () => {
    const items = pick('truefalse', 1);
    const { props, reports } = makeProps(items);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByRole('button', { name: /Wahr/ })).toBeInTheDocument();
    const truth = (items[0] as { correct: boolean }).correct;
    await user.click(screen.getByRole('button', { name: truth ? /Wahr/ : /Falsch/ }));
    expect(reports[0].correct).toBe(true);
  });

  it('Zeitbonus nur ohne Entspannt-Modus', async () => {
    useSettings.setState({ relaxed: false });
    const items = pick('mc', 1);
    const { props, reports } = makeProps(items);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByRole('timer')).toBeInTheDocument();
    await user.keyboard('1');
    expect(reports[0].timeLimitMs).toBe(20000);
  });

  it('× schließt die Runde', async () => {
    const { props, onClose } = makeProps(pick('mc', 2));
    render(<Game {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'Runde beenden' }));
    expect(onClose).toHaveBeenCalled();
  });
});
