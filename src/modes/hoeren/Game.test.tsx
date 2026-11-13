import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { makeProps } from '@/test/harness';
import { listen1, play } from '@/test/english';
import { useSettings } from '@/store/settings';

const spoken: { text: string; rate: number; lang: string }[] = [];
class FakeUtterance {
  text: string; rate = 1; lang = ''; voice: unknown = null;
  constructor(t: string) { this.text = t; }
}
beforeEach(() => {
  useSettings.setState({ sound: false });
  spoken.length = 0;
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: { cancel: () => {}, getVoices: () => [], speak: (u: FakeUtterance) => spoken.push({ text: u.text, rate: u.rate, lang: u.lang }), addEventListener: () => {}, removeEventListener: () => {} },
  });
});
afterEach(() => { vi.unstubAllGlobals(); Reflect.deleteProperty(window, 'speechSynthesis'); });

describe('Hören', () => {
  it('liest den Satz vor (normal und langsam) und wertet die Auswahl', async () => {
    const item = play(listen1);
    const { props, reports } = makeProps([item]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.click(screen.getByRole('button', { name: 'Satz anhören' }));
    await user.click(screen.getByRole('button', { name: 'Langsam anhören' }));
    expect(spoken.map((s) => s.text)).toEqual(Array(2).fill('The train leaves at half past nine.'));
    expect(spoken[1].rate).toBeLessThan(spoken[0].rate);
    expect(spoken[0].lang).toBe('en-GB');
    const right = (item as { options: string[]; correct: number }).options[(item as { correct: number }).correct];
    await user.click(screen.getByRole('button', { name: new RegExp(right.replace('.', '\\.')) }));
    expect(reports[0].correct).toBe(true);
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
    expect(screen.getByText(/Der Zug fährt um halb zehn ab/)).toBeInTheDocument();
  });

  it('falsche Option → falsch', async () => {
    const item = play(listen1) as { options: string[]; correct: number };
    const { props, reports } = makeProps([item as never]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.keyboard(String(item.correct === 0 ? 2 : 1));
    expect(reports[0].correct).toBe(false);
  });

  it('ohne Sprachausgabe wird der Satz zum Lesen angezeigt', () => {
    Reflect.deleteProperty(window, 'speechSynthesis');
    const { props } = makeProps([play(listen1)]);
    render(<Game {...props} />);
    expect(screen.getByTestId('no-tts')).toHaveTextContent('The train leaves at half past nine.');
  });

  it('Abschlussprüfung: erst wählen, dann „Weiter“, kein Feedback', async () => {
    const { props, reports, onFinish } = makeProps([play(listen1)], { exam: { index: 3, total: 20 } });
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.keyboard('1');
    expect(reports).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(reports).toHaveLength(1);
    expect(screen.queryByTestId('feedback')).toBeNull();
    expect(onFinish).toHaveBeenCalled();
  });
});
