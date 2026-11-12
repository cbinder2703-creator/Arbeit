import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { makeProps, pick } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));
type Order = Extract<ReturnType<typeof pick>[0], { type: 'order' }>;
const texts = () => screen.getAllByRole('listitem').map((li) => li.getAttribute('aria-label')!.replace(/^Platz \d+ von \d+: /, ''));

describe('Zeitstrahl', () => {
  it('startet gemischt; Pfeiltasten verschieben die Zeile', async () => {
    const item = pick('order', 1, 1)[0] as Order; // 6 Schritte
    const { props } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    const before = texts();
    expect(before).not.toEqual(item.steps);
    screen.getByTestId('step-0').focus();
    await user.keyboard('{ArrowDown}');
    const after = texts();
    expect(after[1]).toBe(before[0]);
    expect(after[0]).toBe(before[1]);
  });

  it('richtig sortiert → fehlerfrei; sonst richtige Plätze rot mit Hinweis', async () => {
    const item = pick('order', 1, 1)[0] as Order;
    const { props, reports } = makeProps([item]);
    const user = userEvent.setup();
    const { unmount } = render(<Game {...props} />);
    // Selection-Sort per „Nach oben“-Knopf
    for (let target = 0; target < item.steps.length; target++) {
      let at = texts().indexOf(item.steps[target]);
      while (at > target) {
        await user.click(within(screen.getByTestId(`step-${at}`)).getByRole('button', { name: 'Nach oben' }));
        at--;
      }
    }
    expect(texts()).toEqual(item.steps);
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(reports[0]).toMatchObject({ correct: true, parts: { total: item.steps.length, correct: item.steps.length } });
    unmount();

    const h = makeProps([item]);
    render(<Game {...h.props} />);
    await user.click(screen.getByRole('button', { name: 'Prüfen' })); // ungeordnet abgeben
    expect(h.reports[0].correct).toBe(false);
    expect(screen.getAllByText(/gehört auf Platz/).length).toBeGreaterThan(0);
  });

  it('Zeile antippen, dann „Hoch“/„Runter“ verschiebt sie (Handy ohne Ziehen)', async () => {
    const item = pick('order', 1, 1)[0] as Order;
    const { props } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    const before = texts();
    expect(screen.getByRole('button', { name: 'Ausgewählte Zeile nach oben' })).toBeDisabled();
    await user.click(screen.getByTestId('step-2'));
    await user.click(screen.getByRole('button', { name: 'Ausgewählte Zeile nach oben' }));
    let after = texts();
    expect(after[1]).toBe(before[2]);
    // die Auswahl bleibt an der Zeile: nochmal hoch, dann runter
    await user.click(screen.getByRole('button', { name: 'Ausgewählte Zeile nach oben' }));
    after = texts();
    expect(after[0]).toBe(before[2]);
    await user.click(screen.getByRole('button', { name: 'Ausgewählte Zeile nach unten' }));
    expect(texts()[1]).toBe(before[2]);
    expect(screen.getByRole('button', { name: 'Ausgewählte Zeile nach oben' })).toBeEnabled();
  });
});
