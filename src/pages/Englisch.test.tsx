import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '@/app/App';
import { getPruefung } from '@/content/loader';
import { useProgress } from '@/store/progress';
import { useSettings } from '@/store/settings';
import { allModes } from '@/modes/registry';
import { isModeAvailable } from '@/engine/session';

const PID = 'englisch-b1';
const en = getPruefung(PID)!;
const azubi = getPruefung('berufsbildung-arbeitswelt')!;

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().resetAll();
  useSettings.setState({ sound: false, relaxed: true, speechConsent: false });
});

const open = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe('English Quest – Inhalte und Modi', () => {
  it('ist ein eigenes Spiel mit Lernpfad; die Azubi-Akademie hat keinen', () => {
    expect(en.meta.gameTitle).toBe('English Quest');
    expect(en.meta.speech?.lang).toBe('en-GB');
    expect(en.chapters.flatMap((c) => c.lessons)).toHaveLength(12);
    expect(en.chapters.reduce((n, c) => n + c.items.length, 0)).toBe(96);
    expect(azubi.chapters.every((c) => c.lessons.length === 0)).toBe(true);
  });
  it('neue Modi erscheinen nur dort, wo es passende Aufgaben gibt', () => {
    const ids = (p: typeof en) => allModes.filter((m) => isModeAvailable(m, p)).map((m) => m.id);
    expect(ids(en)).toEqual(expect.arrayContaining(['satz-bauen', 'hoeren', 'sprechen', 'quiz-blitz', 'lueckentext', 'memory', 'lernkarten']));
    expect(ids(azubi)).not.toEqual(expect.arrayContaining(['satz-bauen']));
    expect(ids(azubi)).not.toContain('hoeren');
    expect(ids(azubi)).not.toContain('sprechen');
  });
  it('jede Lektion hat 8 Aufgaben; jede Aufgabe steckt in genau einer Lektion', () => {
    for (const c of en.chapters) {
      const used = c.lessons.flatMap((l) => l.items);
      expect(new Set(used).size).toBe(used.length);
      expect(used.sort()).toEqual(c.items.map((i) => i.id).sort());
      c.lessons.forEach((l) => expect(l.items).toHaveLength(8));
    }
  });
});

describe('Lernpfad-Seiten', () => {
  it('Startseite zeigt „Weiter lernen“, der Pfad hat nur Lektion 1 offen', () => {
    open(`/p/${PID}`);
    expect(screen.getByText('WEITER LERNEN')).toBeInTheDocument();
    expect(screen.getByText(/Lektion 1: Unterwegs/)).toBeInTheDocument();
  });
  it('Pfad: gesperrte Lektionen sind keine Links', () => {
    open(`/p/${PID}/pfad`);
    expect(screen.getByRole('heading', { name: 'Lernpfad' })).toBeInTheDocument();
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.includes('/lektion/'));
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', `/p/${PID}/lektion/e1-l1`);
    expect(screen.getAllByRole('img', { name: /gesperrt/ })).toHaveLength(11);
  });
  it('gesperrte Lektion per Adresse → zurück zum Pfad', () => {
    open(`/p/${PID}/lektion/e2-l3`);
    expect(screen.getByRole('heading', { name: 'Lernpfad' })).toBeInTheDocument();
  });
  it('Azubi-Akademie: keine Pfad-Navigation', () => {
    open('/p/berufsbildung-arbeitswelt');
    expect(screen.queryByText('WEITER LERNEN')).toBeNull();
    expect(screen.queryAllByRole('link', { name: 'Pfad' })).toHaveLength(0);
  });
});

/** wartet, bis die Aufgabe geladen ist (kein „Lädt …“, kein altes Feedback) und der Fortschritt stimmt */
async function ready(done: number, total: number) {
  await waitFor(
    () => {
      expect(screen.queryByText('Lädt …')).toBeNull();
      expect(screen.queryByTestId('feedback')).toBeNull();
      expect(screen.getByLabelText(new RegExp(`Aufgabe ${done} von ${total}$`))).toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}

/** beantwortet die sichtbare Lektions-Aufgabe (irgendein Typ), nach der Antwort kommt das Feedback */
async function answerLessonItem(user: ReturnType<typeof userEvent.setup>) {
  const fb = async () => {
    const sheet = await screen.findByTestId('feedback');
    const btn = within(sheet).getAllByRole('button').find((b) => /Weiter|Lektion beenden|Ergebnis/.test(b.textContent ?? ''))!;
    await user.click(btn);
  };
  if (screen.queryByRole('group', { name: 'Antworten' })) {
    await user.keyboard('1');
    return fb();
  }
  if (screen.queryByTestId('answer-line')) {
    const bank = screen.getByRole('group', { name: 'Wörter zur Auswahl' });
    await user.click(bank.querySelector('button:not([disabled])') as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    return fb();
  }
  if (screen.queryByTestId('cloze-text')) {
    const gaps = document.querySelectorAll('[data-testid^=gap-]').length;
    const chips = screen.getByRole('group', { name: 'Wörter zur Auswahl' });
    for (let i = 0; i < gaps; i++) await user.click(chips.querySelector('button:not([disabled])') as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    return fb();
  }
  if (screen.queryByTestId('sentence')) {
    // Sprechen ohne Spracherkennung → Selbstbewertung
    await user.click(screen.getByRole('button', { name: /Gut gesprochen/ }));
    return fb();
  }
  if (screen.queryByRole('list', { name: 'Schritte' })) {
    await user.click(screen.getByRole('button', { name: 'Prüfen' }));
    return fb();
  }
  if (screen.queryByRole('group', { name: 'Memory-Karten' })) {
    const cards = screen.getAllByRole('button').filter((b) => b.dataset.testid?.startsWith('card-'));
    const byPair = new Map<string, HTMLElement[]>();
    cards.forEach((c) => byPair.set(c.dataset.pair!, [...(byPair.get(c.dataset.pair!) ?? []), c]));
    for (const [a, b] of byPair.values()) {
      await user.click(a);
      await user.click(b);
      await new Promise((r) => setTimeout(r, 520));
    }
    // Memory geht nach kurzer Zeit von selbst weiter
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Memory-Karten' })).toBeNull(), { timeout: 4000 });
    return;
  }
  if (screen.queryByTestId('current-card')) {
    while (screen.queryByTestId('current-card')) {
      await user.click(screen.getByTestId('current-card'));
      await user.click(document.querySelector('[data-testid^=zone-]') as HTMLElement);
    }
    return fb();
  }
  throw new Error('Unbekannte Lektionsansicht:\n' + document.body.textContent?.slice(0, 300));
}

describe('Lektion durchspielen', () => {
  it('Grammatik-Tipp → 8 Aufgaben mit Feedback → Wiederholung der Fehler → Ergebnis; nächste Lektion wird frei', async () => {
    const user = userEvent.setup();
    open(`/p/${PID}/lektion/e1-l1`);

    // Grammatik-Tipp vor der Lektion
    expect(await screen.findByText('Present Perfect: have/has + 3. Form')).toBeInTheDocument();
    expect(screen.getByText('I have booked a flight.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Los geht’s/ }));

    // erste Runde: Kopfzeile zeigt die erledigten Aufgaben der ganzen Lektion (0/8, 1/8 …)
    for (let i = 1; i <= 8; i++) {
      await ready(i - 1, 8);
      await answerLessonItem(user);
    }

    // Wiederholung der Fehler (falls es welche gab) – wir antworten absichtlich „irgendwie“
    const retry = screen.queryByText('Noch einmal!');
    const retryOrResult = await waitFor(() => screen.queryByText('Noch einmal!') ?? screen.getByTestId('result'), { timeout: 4000 }).catch((e) => {
      console.log('DOM bei Fehler:', document.body.textContent?.slice(0, 400));
      throw e;
    });
    if (retry || retryOrResult.textContent?.includes('Noch einmal')) {
      const n = Number(screen.getByText(/Aufgabe(n)? ha(t|ben) noch nicht geklappt/).textContent!.match(/\d+/)![0]);
      await user.click(screen.getByRole('button', { name: 'Los' }));
      for (let i = 1; i <= n; i++) {
        await ready(i - 1, n);
        await answerLessonItem(user);
      }
    }

    const result = await screen.findByTestId('result', {}, { timeout: 6000 });
    expect(within(result).getByText('Lektion geschafft!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nächste Lektion/ })).toBeInTheDocument();
    const f = useProgress.getState().byPruefung[PID];
    expect(f.lessons['e1-l1'].stars).toBeGreaterThanOrEqual(1);
    expect(Object.keys(f.leitner).every((id) => id.startsWith('e1-'))).toBe(true);
    expect(f.xp).toBeGreaterThanOrEqual(0);
  }, 90000);
});
