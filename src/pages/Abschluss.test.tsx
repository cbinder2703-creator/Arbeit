import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/App';
import { getPruefung } from '@/content/loader';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { pickExamItems, fractionOf, scoreExam } from '@/engine/exam';
import { mulberry32 } from '@/engine/shuffle';

const PID = 'berufsbildung-arbeitswelt';
const pr = getPruefung(PID)!;

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().resetAll();
  useSettings.setState({ sound: false, relaxed: true });
});

function unlock(percent: number) {
  const items = pr.chapters.flatMap((c) => c.items);
  const n = Math.ceil((items.length * percent) / 100);
  items.slice(0, n).forEach((i) => useProgress.getState().recordAnswer(PID, i.id, true, '2026-01-01'));
}

const open = () =>
  render(
    <MemoryRouter initialEntries={[`/p/${PID}/abschluss`]}>
      <AppRoutes />
    </MemoryRouter>,
  );

/** beantwortet die gerade sichtbare Prüfungsaufgabe (egal welcher Typ) */
async function answerCurrent(user: ReturnType<typeof userEvent.setup>) {
  const q = screen.queryByRole('group', { name: 'Antworten' });
  if (q) {
    await user.keyboard('1');
    return user.click(screen.getByRole('button', { name: 'Weiter' }));
  }
  if (screen.queryByRole('radiogroup', { name: 'Dein Urteil' })) {
    await user.click(screen.getAllByRole('radio')[0]);
    return user.click(screen.getByRole('button', { name: 'Weiter' }));
  }
  if (screen.queryByTestId('current-card')) {
    // Sortieren: jede Karte ins erste Fach
    while (screen.queryByTestId('current-card')) {
      await user.click(screen.getByTestId('current-card'));
      await user.click(document.querySelector('[data-testid^=zone-]') as HTMLElement);
    }
    return;
  }
  if (screen.queryByRole('list', { name: 'Vertragszeilen' })) {
    return user.click(screen.getByRole('button', { name: /^Weiter/ }));
  }
  if (screen.queryByTestId('cloze-text')) {
    const gaps = document.querySelectorAll('[data-testid^=gap-]').length;
    const chips = screen.getByRole('group', { name: 'Wörter zur Auswahl' });
    for (let i = 0; i < gaps; i++) await user.click(chips.querySelectorAll('button:not([disabled])')[0] as HTMLElement);
    return user.click(screen.getByRole('button', { name: 'Weiter' }));
  }
  if (screen.queryByRole('list', { name: 'Schritte' })) {
    return user.click(screen.getByRole('button', { name: 'Weiter' }));
  }
  if (screen.queryByRole('list', { name: 'Begriffe' })) {
    const n = screen.getAllByRole('list', { name: 'Begriffe' })[0].children.length;
    for (let i = 0; i < n; i++) {
      await user.click(screen.getByTestId(`left-${i}`));
      await user.click(screen.getByTestId(`right-${i}`));
    }
    return user.click(screen.getByRole('button', { name: 'Weiter' }));
  }
  throw new Error('Unbekannte Prüfungsansicht:\n' + document.body.textContent?.slice(0, 300));
}

describe('Abschlussprüfung – Engine', () => {
  it('zieht 20 Aufgaben anteilig aus allen Kapiteln, ohne Duplikate', () => {
    const picks = pickExamItems(pr, 20, mulberry32(4));
    expect(picks).toHaveLength(20);
    expect(new Set(picks.map((p) => p.item.id)).size).toBe(20);
    const perChapter = new Set(picks.map((p) => p.chapter.id));
    expect(perChapter.size).toBe(4);
  });
  it('Teilpunkte und Note nach IHK-Schlüssel', () => {
    expect(fractionOf({ correct: true })).toBe(1);
    expect(fractionOf({ correct: false })).toBe(0);
    expect(fractionOf({ correct: false, parts: { total: 4, correct: 3, errors: 0 } })).toBe(0.75);
    expect(fractionOf({ correct: false, parts: { total: 4, correct: 1, errors: 3 } })).toBe(0);
    const picks = pickExamItems(pr, 20, mulberry32(1));
    const all = Object.fromEntries(picks.map((p) => [p.item.id, 1]));
    expect(scoreExam(picks, all)).toMatchObject({ percent: 100, grade: 1, passed: true });
    const half = Object.fromEntries(picks.map((p, i) => [p.item.id, i < 10 ? 1 : 0]));
    expect(scoreExam(picks, half)).toMatchObject({ percent: 50, grade: 4, passed: true });
    const few = Object.fromEntries(picks.map((p, i) => [p.item.id, i < 9 ? 1 : 0]));
    expect(scoreExam(picks, few)).toMatchObject({ percent: 45, grade: 5, passed: false });
  });
});

describe('Abschlussprüfung – Seite', () => {
  it('ist gesperrt unter 60 % und zeigt den Fortschritt', () => {
    unlock(36);
    open();
    expect(screen.getByText(/Frei ab 60 % – du hast 36 %/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Noch gesperrt/ })).toBeDisabled();
  });

  it('ab 60 % frei: 20 Aufgaben ohne Feedback, am Ende Note, Auswertung je Kapitel, Speicherung', async () => {
    unlock(60);
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: /Abschlussprüfung starten/ }));

    for (let i = 1; i <= 20; i++) {
      await waitFor(() => expect(screen.getByLabelText(new RegExp(`Aufgabe ${i} von 20`))).toBeInTheDocument());
      await answerCurrent(user);
      expect(screen.queryByTestId('feedback')).toBeNull(); // kein Feedback zwischendurch
    }
    expect(await screen.findByTestId('exam-result')).toBeInTheDocument();
    const grade = Number(screen.getByTestId('grade').textContent);
    expect(grade).toBeGreaterThanOrEqual(1);
    expect(grade).toBeLessThanOrEqual(6);
    expect(screen.getByText('Auswertung je Kapitel')).toBeInTheDocument();
    const f = useProgress.getState().byPruefung[PID];
    expect(f.examAttempts).toBe(1);
    expect(f.bestGrade).toBe(grade);
    expect(f.xp).toBeGreaterThanOrEqual(0);
  }, 30000);
});
