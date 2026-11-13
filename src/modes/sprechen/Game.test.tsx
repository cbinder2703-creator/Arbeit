import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { makeProps } from '@/test/harness';
import { play, speak1, speak2 } from '@/test/english';
import { useSettings } from '@/store/settings';

/** Falsche Spracherkennung: liefert der Reihe nach die vorgegebenen Antworten */
function mockRecognition(answers: (string[] | Error)[]) {
  let call = 0;
  class FakeRec {
    lang = ''; interimResults = false; maxAlternatives = 1; continuous = false;
    onresult: ((e: unknown) => void) | null = null; onerror: ((e: { error: string }) => void) | null = null; onend: (() => void) | null = null;
    start() {
      const a = answers[call++];
      setTimeout(() => {
        if (a instanceof Error) this.onerror?.({ error: a.message });
        else if (a.length) this.onresult?.({ results: [a.map((t) => ({ transcript: t, confidence: 0.9 }))] });
        this.onend?.();
      }, 0);
    }
    stop() {}
    abort() {}
  }
  (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition = FakeRec;
}

beforeEach(() => useSettings.setState({ sound: false, speechConsent: false }));
afterEach(() => { Reflect.deleteProperty(window, 'SpeechRecognition'); });

describe('Sprechen', () => {
  it('ohne Spracherkennung: Selbstbewertung funktioniert, Überspringen zählt nicht', async () => {
    const { props, reports, onFinish } = makeProps([play(speak1), play(speak2)]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByTestId('sentence')).toHaveTextContent('Nice to meet you.');
    await user.click(screen.getByRole('button', { name: /Gut gesprochen/ }));
    expect(reports[0].correct).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    await user.click(screen.getByRole('button', { name: /überspringen/ }));
    expect(reports).toHaveLength(1);
    expect(onFinish).toHaveBeenCalled();
  });

  it('Mikrofon braucht erst die Zustimmung; „Ohne Mikrofon üben“ geht auch', async () => {
    mockRecognition([]);
    const { props } = makeProps([play(speak1)]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByRole('region', { name: 'Zustimmung Spracherkennung' })).toHaveTextContent(/Google oder Apple/);
    expect(screen.queryByRole('button', { name: 'Sprechen' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Ohne Mikrofon üben' }));
    expect(screen.getByRole('button', { name: /Gut gesprochen/ })).toBeInTheDocument();
  });

  it('mit Zustimmung: richtig erkannt (Groß/Klein egal) → richtig', async () => {
    useSettings.setState({ speechConsent: true });
    mockRecognition([['nice to meet you']]);
    const { props, reports } = makeProps([play(speak1)]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.click(screen.getByRole('button', { name: 'Sprechen' }));
    expect(await screen.findByTestId('feedback')).toHaveAttribute('data-correct', 'true');
    expect(reports[0].correct).toBe(true);
  });

  it('falsch erkannt: Anzeige was verstanden wurde, bis zu 3 Versuche, dann „Weiter“ = falsch', async () => {
    useSettings.setState({ speechConsent: true });
    mockRecognition([['nice to meat ya'], ['hello']]);
    const { props, reports } = makeProps([play(speak1)]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.click(screen.getByRole('button', { name: 'Sprechen' }));
    expect(await screen.findByTestId('heard')).toHaveTextContent('nice to meat ya');
    expect(reports).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: /Nochmal sprechen/ }));
    await screen.findByText(/„hello“/);
    await user.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(reports[0].correct).toBe(false);
  });

  it('Fehler (kein Mikrofon-Zugriff) wird verständlich erklärt', async () => {
    useSettings.setState({ speechConsent: true });
    mockRecognition([new Error('not-allowed')]);
    const { props } = makeProps([play(speak1)]);
    const user = userEvent.setup();
    render(<Game {...props} />);
    await user.click(screen.getByRole('button', { name: 'Sprechen' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Mikrofon ist nicht erlaubt/);
  });
});
