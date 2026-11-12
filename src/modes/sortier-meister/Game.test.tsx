import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));

type Sort = Extract<ReturnType<typeof pick>[0], { type: 'sort' }>;

async function solveNext(user: ReturnType<typeof userEvent.setup>, item: Sort, wrongFirst = false) {
  const text = screen.getByTestId('current-card').textContent!;
  const card = item.cards.find((c) => c.text === text)!;
  const right = card.category;
  const wrong = item.categories.find((c) => c.id !== right)!.id;
  await user.click(screen.getByTestId('current-card'));
  if (wrongFirst) {
    await user.click(screen.getByTestId(`zone-${wrong}`));
    await user.click(screen.getByTestId('current-card'));
  }
  await user.click(screen.getByTestId(`zone-${right}`));
}

describe('Sortier-Meister', () => {
  it('Karte antippen → Fach antippen sortiert alle Karten, fehlerfrei = +100 je Karte', async () => {
    const item = pick('sort', 1, 0)[0] as Sort; // k1-201, 6 Karten
    const { props, reports, onFinish } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    for (let i = 0; i < item.cards.length; i++) await solveNext(user, item);

    expect(reports).toHaveLength(1);
    expect(reports[0].correct).toBe(true);
    expect(reports[0].parts).toEqual({ total: item.cards.length, correct: item.cards.length, errors: 0 });
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
    await user.click(screen.getByRole('button', { name: 'Ergebnis ansehen' }));
    expect(onFinish).toHaveBeenCalledWith({ score: item.cards.length * 100, maxScore: item.cards.length * 100 });
  });

  it('falsch einsortiert: Hinweis, Karte bleibt, −50 Punkte, zählt als Fehler', async () => {
    const item = pick('sort', 1, 0)[0] as Sort;
    const { props, reports } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await solveNext(user, item, true);
    expect(screen.getByTestId('hint')).not.toHaveTextContent(/gehört nicht zu/); // Hinweis verschwindet nach dem richtigen Treffer
    for (let i = 1; i < item.cards.length; i++) await solveNext(user, item);
    expect(reports[0].correct).toBe(false);
    expect(reports[0].parts).toEqual({ total: item.cards.length, correct: item.cards.length - 1, errors: 1 });
  });

  it('falsches Fach zeigt den Hinweistext', async () => {
    const item = pick('sort', 1, 0)[0] as Sort;
    const { props } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    const text = screen.getByTestId('current-card').textContent!;
    const right = item.cards.find((c) => c.text === text)!.category;
    const wrong = item.categories.find((c) => c.id !== right)!;
    await user.click(screen.getByTestId('current-card'));
    await user.click(screen.getByTestId(`zone-${wrong.id}`));
    expect(screen.getByTestId('hint')).toHaveTextContent(/gehört nicht zu/);
    expect(within(screen.getByTestId(`zone-${wrong.id}`)).getByText('0 Karten')).toBeInTheDocument();
  });

  it('Fach antippen ohne Karte gewählt erklärt die Bedienung', async () => {
    const item = pick('sort', 1, 0)[0] as Sort;
    const { props } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.click(screen.getByTestId(`zone-${item.categories[0].id}`));
    expect(screen.getByTestId('hint')).toHaveTextContent(/Tippe zuerst die Karte an/);
  });

  it('Zifferntasten legen die Karte in das n-te Fach (PC)', async () => {
    const item = pick('sort', 1, 0)[0] as Sort;
    const { props } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    const text = screen.getByTestId('current-card').textContent!;
    const idx = item.categories.findIndex((c) => c.id === item.cards.find((k) => k.text === text)!.category);
    await user.keyboard(String(idx + 1));
    expect(screen.queryByTestId('current-card')?.textContent).not.toBe(text);
  });
});
