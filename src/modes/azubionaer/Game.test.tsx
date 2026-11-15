import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game, { LADDER, audienceVotes, guaranteed, walkAway } from './Game';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));
type MC = Extract<ReturnType<typeof pick>[0], { type: 'mc' }>;
const items = () => pick('mc', 18, 1) as MC[];
const current = (all: MC[]) => all.find((i) => i.question === screen.getByTestId('question').textContent)!;
const answerBtns = () => within(screen.getByRole('group', { name: 'Antworten' })).getAllByRole('button', { hidden: true });

describe('Wer wird Azubionär?', () => {
  it('Geldleiter und Sicherheitsstufen', () => {
    expect(LADDER).toHaveLength(15);
    expect(LADDER[14]).toBe(1_000_000);
    expect([0, 3, 4].map(guaranteed)).toEqual([0, 0, 0]); // falsch vor/auf Frage 5 → nichts sicher
    expect([5, 9].map(guaranteed)).toEqual([500, 500]);
    expect([10, 14].map(guaranteed)).toEqual([16000, 16000]);
    expect([0, 1, 5].map(walkAway)).toEqual([0, 50, 500]);
  });

  it('richtige Antwort braucht „Finale Antwort“, danach nächste Frage mit höherem Betrag', async () => {
    const all = items();
    const { props, reports } = makeProps(all);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByRole('list', { name: 'Gewinnleiter' }).children).toHaveLength(15);
    expect(screen.getByText(/Frage 1 · 50 Taler/)).toBeInTheDocument();
    const q = current(all);
    await user.click(answerBtns()[q.correct]);
    expect(reports).toHaveLength(0); // nur markiert, noch nicht gewertet
    await user.click(screen.getByRole('button', { name: /Finale Antwort/ }));
    expect(reports[0].correct).toBe(true);
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
    await user.click(screen.getByRole('button', { name: 'Nächste Frage' }));
    expect(screen.getByText(/Frage 2 · 100 Taler/)).toBeInTheDocument();
  });

  it('falsche Antwort in Frage 1 → Spielende ohne Gewinn', async () => {
    const all = items();
    const { props, onFinish } = makeProps(all);
    const user = userEvent.setup();
    render(<Game {...props} />);
    const q = current(all);
    await user.click(answerBtns()[q.correct === 0 ? 1 : 0]);
    await user.click(screen.getByRole('button', { name: /Finale Antwort/ }));
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'false');
    await user.click(screen.getByRole('button', { name: 'Zur Auswertung' }));
    expect(screen.getByTestId('amount')).toHaveTextContent('0 Taler');
    await user.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('Aussteigen nach einer richtigen Antwort nimmt 50 Taler mit', async () => {
    const all = items();
    const { props } = makeProps(all);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.click(answerBtns()[current(all).correct]);
    await user.click(screen.getByRole('button', { name: /Finale Antwort/ }));
    await user.click(screen.getByRole('button', { name: 'Nächste Frage' }));
    await user.click(screen.getByRole('button', { name: /Aussteigen/ }));
    expect(screen.getByTestId('amount')).toHaveTextContent('50 Taler');
  });

  it('Joker 50:50 blendet zwei falsche Antworten aus (die richtige bleibt), nur einmal', async () => {
    const all = items();
    const { props } = makeProps(all);
    const user = userEvent.setup();
    render(<Game {...props} />);
    const q = current(all);
    await user.click(screen.getByRole('button', { name: 'Joker 50:50' }));
    const btns = answerBtns();
    expect(btns.filter((b) => b.dataset.state === 'gone')).toHaveLength(2);
    expect(btns[q.correct].dataset.state).not.toBe('gone');
    expect(screen.getByRole('button', { name: 'Joker 50:50' })).toBeDisabled();
  });

  it('Publikumsjoker zeigt Prozente, die 100 ergeben; Verteilung bevorzugt die richtige', async () => {
    const v = audienceVotes([0, 1, 2, 3], 2, 1, false);
    expect(Object.values(v).reduce((a, b) => a + b, 0)).toBe(100);
    expect(v[2]).toBeGreaterThanOrEqual(50);
    const all = items();
    const { props } = makeProps(all);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.click(screen.getByRole('button', { name: 'Joker Publikum' }));
    const pct = screen.getAllByLabelText(/\d+ Prozent/).map((e) => Number(e.getAttribute('aria-label')!.match(/\d+/)![0]));
    expect(pct).toHaveLength(4);
    expect(pct.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('Tauschen ersetzt die Frage durch eine Ersatzfrage', async () => {
    const all = items();
    const { props } = makeProps(all);
    const user = userEvent.setup();
    render(<Game {...props} />);
    const before = screen.getByTestId('question').textContent;
    await user.click(screen.getByRole('button', { name: 'Joker Frage tauschen' }));
    expect(screen.getByTestId('question').textContent).not.toBe(before);
    expect(screen.getByRole('button', { name: 'Joker Frage tauschen' })).toBeDisabled();
  });
});
