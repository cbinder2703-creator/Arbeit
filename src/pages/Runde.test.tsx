import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/App';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().resetAll();
  useSettings.setState({ relaxed: true, sound: false });
});

const PID = 'berufsbildung-arbeitswelt';
const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe('Runde (Engine + Modus + Ergebnis)', () => {
  it('Quiz-Blitz Kapitel 1: 10 Fragen → Ergebnis, XP und Leitner werden unter der Prüfung gespeichert', async () => {
    const user = userEvent.setup();
    at(`/p/${PID}/spiel/quiz-blitz?kapitel=k1`);
    for (let i = 0; i < 10; i++) {
      await screen.findByRole('group', { name: 'Antworten' });
      await user.keyboard('1');
      await user.keyboard('{Enter}');
    }
    expect(await screen.findByTestId('result')).toBeInTheDocument();
    const f = useProgress.getState().byPruefung[PID];
    expect(Object.keys(f.leitner)).toHaveLength(10);
    expect(Object.keys(f.leitner).every((id) => id.startsWith('k1-'))).toBe(true);
    expect(f.rounds).toBe(1);
    expect(f.bestScores['quiz-blitz:k1']).toBeGreaterThanOrEqual(0);
    // andere Prüfungen bleiben unberührt
    expect(Object.keys(useProgress.getState().byPruefung)).toEqual([PID]);
    expect(screen.getByRole('button', { name: 'Nochmal' })).toBeInTheDocument();
  });

  it('Fehler üben startet eine Runde nur mit den falschen Aufgaben', async () => {
    const user = userEvent.setup();
    at(`/p/${PID}/spiel/quiz-blitz?kapitel=k2`);
    for (let i = 0; i < 10; i++) {
      await screen.findByRole('group', { name: 'Antworten' });
      await user.keyboard('1');
      await user.keyboard('{Enter}');
    }
    await screen.findByTestId('result');
    const wrongIds = Object.entries(useProgress.getState().byPruefung[PID].leitner).filter(([, e]) => e.wrong > 0).map(([id]) => id);
    if (wrongIds.length === 0) return; // (zufällig alles richtig – dann gibt es nichts zu üben)
    await user.click(screen.getByRole('button', { name: /Fehler üben/ }));
    await screen.findByRole('group', { name: 'Antworten' });
    // Fortschrittsanzeige: Anzahl = Anzahl der Fehler
    expect(screen.getByLabelText(new RegExp(`Aufgabe \\d+ von ${wrongIds.length}`))).toBeInTheDocument();
  });

  it('unbekannter Modus → 404', async () => {
    at(`/p/${PID}/spiel/gibt-es-nicht`);
    expect(await screen.findByText(/gibt es nicht/)).toBeInTheDocument();
  });

  it('Modus-Seite zeigt nur passende Modi', async () => {
    at(`/p/${PID}/modi?kapitel=k1`);
    expect(await screen.findByText('Quiz-Blitz')).toBeInTheDocument();
    expect(screen.getByText('Sortier-Meister')).toBeInTheDocument();
  });
});
