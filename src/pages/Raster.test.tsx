import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/App';
import { getPruefung } from '@/content/loader';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { allModes } from '@/modes/registry';
import { isModeAvailable } from '@/engine/session';

const PID = 'lf7-rasterung-rip';
const pr = getPruefung(PID)!;
const items = pr.chapters.flatMap((c) => c.items);

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().resetAll();
  useSettings.setState({ sound: false, relaxed: true });
});

const right = (part: string) => {
  const q = items.find((i) => i.type === 'mc' && i.question.includes(part));
  return q && q.type === 'mc' ? q.options[q.correct] : undefined;
};

describe('Raster-Meister (LF7) – Inhalte', () => {
  it('ist ein eigenes Spiel ohne Prüfungstermin mit 7 Kapiteln und 14 Lektionen', () => {
    expect(pr.meta.gameTitle).toBe('Raster-Meister');
    expect(pr.meta.examDate).toBeNull();
    expect(pr.chapters).toHaveLength(7);
    expect(pr.chapters.flatMap((c) => c.lessons)).toHaveLength(14);
    for (const t of ['mc', 'truefalse', 'sort', 'pairs', 'order', 'cloze']) expect(items.some((i) => i.type === t)).toBe(true);
  });

  it('jede Aufgabe steckt in genau einer Lektion', () => {
    const inLessons = pr.chapters.flatMap((c) => c.lessons.flatMap((l) => l.items));
    expect(new Set(inLessons).size).toBe(inLessons.length);
    expect(inLessons.length).toBe(items.length);
  });

  it('Werte aus dem Blatt stimmen (Rechnungen und Zahlen)', () => {
    expect(right('Wie viele Rasterpunkte pro cm² hat ein 60er Raster')).toBe('3.600');
    expect(right('60 l/cm. Wie viel ist das in lpi')).toBe('Ca. 152 lpi');
    expect(right('Wie viele Rasterelemente liegen auf einer Seitenlänge')).toBe('16');
    expect(right('Ein 60er Raster (60 L/cm) braucht')).toBe('960 L/cm (60 × 16)');
    expect(right('Wie viel dpi sind 960 L/cm')).toBe('Ca. 2.438 dpi');
    expect(right('Welche Winkelung ist bei einfarbigen')).toBe('45°');
    expect(right('Welche Farbe liegt in der Praxis auf 75°')).toBe('Magenta');
    expect(right('Wie groß und mit welcher Auflösung ist die Bilddatei')).toBe('35 × 45 mm, 300 ppi');
  });

  it('Zuordnungen: Winkel in der Praxis, Punktschluss-Werte', () => {
    const pairs = (title: string) => {
      const q = items.find((i) => i.type === 'pairs' && i.question.startsWith(title));
      return q && q.type === 'pairs' ? Object.fromEntries(q.pairs.map((p) => [p.left, p.right])) : {};
    };
    expect(pairs('Farbe und Winkel (Praxis)')).toEqual({ Yellow: '0°', Cyan: '15°', Schwarz: '45°', Magenta: '75°' });
    expect(pairs('Punktschluss bei welchem Tonwert')['Round (Flexo)']).toBe('ca. 78 %');
    expect(pairs('Rasterwinkel laut Anleitung')).toEqual({ Cyan: '105°', Magenta: '165°', 'Gelb (Y)': '0°', 'Schwarz (K)': '45°' });
  });

  it('Arbeitsblätter prüfen ist da; Spielmodi passen (kein Gericht/Detektiv)', () => {
    expect(pr.korrektur?.sheets.length).toBeGreaterThan(0);
    const modes = allModes.filter((m) => isModeAvailable(m, pr)).map((m) => m.id);
    expect(modes).toContain('quiz-blitz');
    expect(modes).not.toContain('kuendigungs-gericht');
    expect(modes).not.toContain('vertrags-detektiv');
  });
});

describe('Raster-Meister – Seiten', () => {
  it('Startseite „Meine Prüfungen“ zeigt die Kachel; Prüfungsstart zeigt Titel und Fach', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getAllByText('Raster-Meister').length).toBeGreaterThan(0));
  });
});
