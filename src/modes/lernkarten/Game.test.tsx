import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { cards, makeProps } from '@/test/harness';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));

describe('Lernkarten', () => {
  it('Antworten sind erst nach dem Umdrehen möglich; „Nochmal“ stellt die Karte hinten an', async () => {
    const list = cards(3);
    const { props, reports, onFinish } = makeProps([], { flashcards: list });
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByRole('button', { name: /Wusste ich/ })).toBeDisabled();
    expect(screen.getByTestId('term')).toHaveTextContent(list[0].term);

    await user.click(screen.getByTestId('flashcard'));
    expect(screen.getByTestId('definition')).toHaveTextContent(list[0].definition.slice(0, 20));
    await user.click(screen.getByRole('button', { name: /Nochmal/ }));
    expect(reports).toEqual([expect.objectContaining({ itemId: list[0].id, correct: false })]);
    expect(screen.getByTestId('term')).toHaveTextContent(list[1].term);

    for (let i = 0; i < 2; i++) {
      await user.click(screen.getByTestId('flashcard'));
      await user.click(screen.getByRole('button', { name: /Wusste ich/ }));
    }
    // die zurückgestellte Karte kommt am Ende nochmal
    expect(screen.getByTestId('term')).toHaveTextContent(list[0].term);
    await user.keyboard(' ');
    await user.keyboard('{ArrowRight}');
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(reports).toHaveLength(3); // jede Karte genau einmal fürs Leitner-System
  });
});
