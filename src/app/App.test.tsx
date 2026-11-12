import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';

const at = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe('Routing + Layouts', () => {
  it('„Meine Prüfungen“ zeigt die Azubi-Akademie als Kachel + „Neue Prüfung“', () => {
    at('/');
    expect(screen.getByRole('heading', { name: 'Meine Prüfungen' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Azubi-Akademie öffnen/ })).toHaveAttribute('href', '/p/berufsbildung-arbeitswelt');
    expect(screen.getByText('Neue Prüfung kommt bald')).toBeInTheDocument();
  });
  it('Prüfungs-Startseite: Kapitel, Heute dran, Abschlussprüfung, Thema', () => {
    const { container } = at('/p/berufsbildung-arbeitswelt');
    expect(screen.getByRole('heading', { name: 'Azubi-Akademie' })).toBeInTheDocument();
    expect(screen.getByText('Formen der Berufsbildung')).toBeInTheDocument();
    expect(screen.getByText('Berufsausbildungsvertrag')).toBeInTheDocument();
    expect(screen.getByText(/frei ab 60 %/)).toBeInTheDocument();
    expect(screen.getByText('HEUTE DRAN')).toBeInTheDocument();
    const themed = container.querySelector('[data-pruefung]') as HTMLElement;
    expect(themed.style.getPropertyValue('--p-color')).toBe('#F97316');
  });
  it('unbekannte Prüfung → 404', () => {
    at('/p/gibt-es-nicht');
    expect(screen.getByText(/gibt es nicht/)).toBeInTheDocument();
  });
  it('Profil + Impressum erreichbar', () => {
    at('/profil');
    expect(screen.getByRole('heading', { name: 'Profil' })).toBeInTheDocument();
  });
});
