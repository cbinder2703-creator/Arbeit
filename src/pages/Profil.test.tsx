import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/App';
import { useProgress } from '@/store/progress';

const PID = 'berufsbildung-arbeitswelt';
beforeEach(() => {
  localStorage.clear();
  useProgress.getState().resetAll();
});

describe('Profil: Fortschritt zurücksetzen', () => {
  it('erst nachfragen, dann nur diese Prüfung löschen und den Zeitpunkt merken', async () => {
    useProgress.getState().addXp(PID, 250);
    useProgress.getState().addXp('englisch-b1', 40);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/profil']}><AppRoutes /></MemoryRouter>);
    const section = screen.getByRole('heading', { name: 'Fortschritt zurücksetzen' }).nextElementSibling as HTMLElement;
    await user.click(within(section).getAllByRole('button', { name: 'Zurücksetzen' })[1]); // Azubi-Akademie (zweite Kachel nach Sortierung)
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(/lässt sich nicht rückgängig machen/);
    expect(useProgress.getState().byPruefung[PID].xp + useProgress.getState().byPruefung['englisch-b1'].xp).toBe(290); // noch nichts passiert
    await user.click(within(dialog).getByRole('button', { name: 'Ja, zurücksetzen' }));
    const s = useProgress.getState().byPruefung;
    const reset = Object.values(s).filter((p) => p.xp === 0);
    const kept = Object.values(s).filter((p) => p.xp > 0);
    expect(reset).toHaveLength(1);
    expect(reset[0].resetAt).toBeGreaterThan(0);
    expect(kept).toHaveLength(1);
  });
  it('Abbrechen lässt alles, wie es ist', async () => {
    useProgress.getState().addXp(PID, 250);
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/profil']}><AppRoutes /></MemoryRouter>);
    const section = screen.getByRole('heading', { name: 'Fortschritt zurücksetzen' }).nextElementSibling as HTMLElement;
    await user.click(within(section).getAllByRole('button', { name: 'Zurücksetzen' })[0]);
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(useProgress.getState().byPruefung[PID].xp).toBe(250);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
