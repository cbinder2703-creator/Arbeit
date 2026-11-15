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
import { buildQuestions } from '@/modes/hoeher-tiefer/questions';

const PID = 'lf2-daten-nutzen';
const pr = getPruefung(PID)!;
const items = pr.chapters.flatMap((c) => c.items);

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().resetAll();
  useSettings.setState({ sound: false, relaxed: true });
});

const open = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe('Print-Profi – Inhalte', () => {
  it('ist ein eigenes Spiel (LF2) mit 8 Kapiteln, 27 Lektionen und allen Aufgabentypen', () => {
    expect(pr.meta.gameTitle).toBe('Print-Profi');
    expect(pr.chapters).toHaveLength(8);
    expect(pr.chapters.flatMap((c) => c.lessons)).toHaveLength(27);
    expect(items.length).toBeGreaterThan(230);
    for (const t of ['mc', 'truefalse', 'sort', 'pairs', 'order', 'cloze']) expect(items.some((i) => i.type === t)).toBe(true);
    // keine Gerichts-/Vertrags-Aufgaben in LF2
    expect(items.some((i) => i.type === 'case' || i.type === 'spot')).toBe(false);
  });
  it('jede Aufgabe steckt in genau einer Lektion', () => {
    for (const c of pr.chapters) {
      const used = c.lessons.flatMap((l) => l.items);
      expect(new Set(used).size).toBe(used.length);
      expect(used.sort()).toEqual(c.items.map((i) => i.id).sort());
    }
  });
  it('passende Spielmodi sind verfügbar, Gericht/Detektiv/Sprach-Modi nicht', () => {
    const ids = allModes.filter((m) => isModeAvailable(m, pr)).map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining(['quiz-blitz', 'wahr-falsch-swipe', 'sortier-meister', 'memory', 'lueckentext', 'zeitstrahl', 'lernkarten', 'hoeher-tiefer', 'azubionaer', 'boss-kampf', 'wort-jagd', 'blasen-quiz']));
    expect(ids).not.toContain('vertrags-detektiv');
    expect(ids).not.toContain('kuendigungs-gericht');
    expect(ids).not.toContain('hoeren');
    expect(ids).not.toContain('sprechen');
  });
  it('Fakten aus den Blättern: DIN-Maße, 8 × A4 in A1, 1922, 16.777.216', () => {
    const din = items.find((i) => i.type === 'pairs' && i.pairs.some((p) => p.left === 'DIN A2'));
    expect(din && din.type === 'pairs' && din.pairs.find((p) => p.left === 'DIN A4')?.right).toBe('210 × 297 mm');
    const sechs = items.find((i) => i.type === 'truefalse' && i.statement.includes('6-mal'));
    expect(sechs).toMatchObject({ correct: false });
    expect(sechs?.explanation).toMatch(/8× in A1/);
    const jahr = items.find((i) => i.type === 'truefalse' && i.statement.includes('1982'));
    expect(jahr).toMatchObject({ correct: false });
    const farben = items.find((i) => i.type === 'mc' && i.question.includes('8 Bit pro Kanal darstellen'));
    expect(farben && farben.type === 'mc' && farben.options[farben.correct]).toBe('16.777.216');
  });
  it('Farbmischung stimmt: Cyan + Gelb = Grün, Magenta + Gelb = Rot, alle drei = Schwarz', () => {
    const mix = items.find((i) => i.type === 'pairs' && i.question === 'Druckfarben übereinander');
    expect(mix && mix.type === 'pairs' && mix.pairs.map((p) => `${p.left}=${p.right}`)).toEqual(['Cyan + Gelb=Grün', 'Magenta + Gelb=Rot', 'Cyan + Magenta=Blau', 'Cyan + Magenta + Gelb=Schwarz']);
  });
  it('Höher oder tiefer: DIN-Diagramm erzeugt Fragen mit mm-Einheit', () => {
    const qs = buildQuestions(pr.chapters[0].charts, 20);
    expect(qs.length).toBeGreaterThan(3);
    expect(qs[0].suffix).toBe(' mm');
  });
});

describe('Print-Profi – Seiten', () => {
  it('Startseite: Weiter lernen, Arbeitsblätter prüfen, 6 Kapitel', () => {
    open(`/p/${PID}`);
    expect(screen.getByText('WEITER LERNEN')).toBeInTheDocument();
    expect(screen.getByText(/Lektion 1: DIN-Formate/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Arbeitsblätter prüfen/ })).toHaveAttribute('href', `/p/${PID}/korrektur`);
    expect(screen.getAllByText('Steckbrief & Formate').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Auflösung & Daten').length).toBeGreaterThan(0);
  });
  it('Meine Prüfungen zeigt drei Spiele', () => {
    open('/');
    expect(screen.getByRole('link', { name: /Print-Profi/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /English Quest/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Azubi-Akademie/ })).toBeInTheDocument();
  });
});

describe('Klassenarbeits-Wiederholung (KA 26)', () => {
  const ka = pr.chapters.filter((c) => c.id === 'k7' || c.id === 'k8');
  it('Kapitel „Klassenarbeit: Wiederholung“ und „Dreisatz“ sind da, mit Lektionen und Lernkarten', () => {
    expect(ka.map((c) => c.id)).toEqual(['k7', 'k8']);
    expect(ka[0].lessons).toHaveLength(4);
    expect(ka[1].lessons).toHaveLength(2);
    expect(ka.every((c) => c.flashcards.length > 0)).toBe(true);
  });
  it('Rechenaufgaben des Blatts haben die richtigen Lösungen', () => {
    const find = (part: string) => ka.flatMap((c) => c.items).find((i) => i.type === 'mc' && i.question.includes(part));
    const right = (part: string) => {
      const q = find(part);
      return q && q.type === 'mc' ? q.options[q.correct] : undefined;
    };
    expect(right('6 kg Offsetfarbe kosten 142,80')).toBe('2.046,80 €');
    expect(right('1600 Kataloge')).toBe('90,2 kg');
    expect(right('Zwei Druckmaschinen drucken zusammen')).toBe('18 750');
    expect(right('4 Mediengestalter')).toBe('8');
    expect(right('Wie viele A6 passen in ein A2')).toBe('16');
    expect(right('Wie viele A5 enthält ein A1')).toBe('16');
    expect(right('Wie viele A3 enthält ein A1')).toBe('4');
    expect(right('Wie schwer ist ein Bogen A3')).toBe('Etwa 10 g');
  });
});

describe('Arbeitsblätter prüfen', () => {
  const k = pr.korrektur!;
  const all = k.sheets.flatMap((s) => s.entries);

  it('ist vorhanden, jeder Eintrag hat eine richtige Lösung; Fehler sind markiert', () => {
    expect(k.sheets).toHaveLength(6);
    expect(all.every((e) => e.correct.length > 5)).toBe(true);
    expect(all.filter((e) => e.status === 'fix').map((e) => e.task)).toEqual(
      expect.arrayContaining([expect.stringContaining('7. Ein DIN A4 passt maximal 6-mal'), expect.stringContaining('Auge: Beschriftung'), expect.stringContaining('grüne Fläche'), expect.stringContaining('Gesamtsumme')]),
    );
    expect(all.filter((e) => e.status === 'missing').length).toBeGreaterThanOrEqual(10);
    // fehlende Antworten haben keine „deine Antwort“
    expect(all.filter((e) => e.status === 'missing').every((e) => e.yours === null)).toBe(true);
  });

  it('zeigt Zähler und lässt sich filtern', async () => {
    const user = userEvent.setup();
    open(`/p/${PID}/korrektur`);
    expect(screen.getByRole('heading', { name: 'Arbeitsblätter prüfen' })).toBeInTheDocument();
    const fixN = all.filter((e) => e.status === 'fix').length;
    const tab = screen.getByRole('tab', { name: new RegExp(`Falsch \\(${fixN}\\)`) });
    await user.click(tab);
    const cards = document.querySelectorAll('[data-status]');
    expect(cards).toHaveLength(fixN);
    expect([...cards].every((c) => c.getAttribute('data-status') === 'fix')).toBe(true);
    expect(screen.getByText(/Es passen also 8 DIN A4 in ein DIN A1/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Alle/ }));
    expect(document.querySelectorAll('[data-status]')).toHaveLength(all.length);
  });

  it('Azubi-Akademie hat diese Seite nicht', () => {
    open('/p/berufsbildung-arbeitswelt/korrektur');
    expect(screen.getByText(/gibt es nicht/)).toBeInTheDocument();
  });
});

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

describe('Lektion 1 (DIN-Formate) durchspielen', () => {
  it('Erklärung → 8 Aufgaben (mc, wahr/falsch, Lücken, Reihenfolge, Zuordnen) → Ergebnis', async () => {
    const user = userEvent.setup();
    open(`/p/${PID}/lektion/k1-l1`);
    expect(await screen.findByText('DIN-Formate – das Wichtigste')).toBeInTheDocument();
    expect(screen.getByText('210 × 297 mm – Briefpapier')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Los geht’s/ }));

    const fb = async () => {
      const sheet = await screen.findByTestId('feedback');
      const btn = within(sheet).getAllByRole('button').find((b) => /Weiter|Lektion beenden|Ergebnis/.test(b.textContent ?? ''))!;
      await user.click(btn);
    };
    for (let i = 1; i <= 8; i++) {
      await ready(i - 1, 8);
      if (screen.queryByRole('group', { name: 'Antworten' })) {
        await user.keyboard('1');
        await fb();
      } else if (screen.queryByTestId('cloze-text')) {
        const gaps = document.querySelectorAll('[data-testid^=gap-]').length;
        const chips = screen.getByRole('group', { name: 'Wörter zur Auswahl' });
        for (let g = 0; g < gaps; g++) await user.click(chips.querySelector('button:not([disabled])') as HTMLElement);
        await user.click(screen.getByRole('button', { name: 'Prüfen' }));
        await fb();
      } else if (screen.queryByRole('list', { name: 'Schritte' })) {
        await user.click(screen.getByRole('button', { name: 'Prüfen' }));
        await fb();
      } else if (screen.queryByRole('group', { name: 'Memory-Karten' })) {
        const cards = screen.getAllByRole('button').filter((b) => b.dataset.testid?.startsWith('card-'));
        const byPair = new Map<string, HTMLElement[]>();
        cards.forEach((c) => byPair.set(c.dataset.pair!, [...(byPair.get(c.dataset.pair!) ?? []), c]));
        for (const [a, b] of byPair.values()) {
          await user.click(a);
          await user.click(b);
          await new Promise((r) => setTimeout(r, 520));
        }
        await waitFor(() => expect(screen.queryByRole('group', { name: 'Memory-Karten' })).toBeNull(), { timeout: 4000 });
      } else throw new Error('Unbekannte Ansicht: ' + document.body.textContent?.slice(0, 200));
    }
    // evtl. Wiederholung der Fehler
    await waitFor(() => expect(screen.queryByText('Noch einmal!') ?? screen.queryByTestId('result')).toBeTruthy(), { timeout: 5000 });
    if (screen.queryByText('Noch einmal!')) {
      const n = Number(screen.getByText(/Aufgabe(n)? ha(t|ben) noch nicht geklappt/).textContent!.match(/\d+/)![0]);
      await user.click(screen.getByRole('button', { name: 'Los' }));
      for (let i = 1; i <= n; i++) {
        await ready(i - 1, n);
        if (screen.queryByRole('group', { name: 'Antworten' })) {
          await user.keyboard('1');
          await fb();
        } else if (screen.queryByTestId('cloze-text')) {
          const gaps = document.querySelectorAll('[data-testid^=gap-]').length;
          const chips = screen.getByRole('group', { name: 'Wörter zur Auswahl' });
          for (let g = 0; g < gaps; g++) await user.click(chips.querySelector('button:not([disabled])') as HTMLElement);
          await user.click(screen.getByRole('button', { name: 'Prüfen' }));
          await fb();
        } else if (screen.queryByRole('list', { name: 'Schritte' })) {
          await user.click(screen.getByRole('button', { name: 'Prüfen' }));
          await fb();
        } else break;
      }
    }
    const result = await screen.findByTestId('result', {}, { timeout: 8000 });
    expect(within(result).getByText('Lektion geschafft!')).toBeInTheDocument();
    expect(useProgress.getState().byPruefung[PID].lessons['k1-l1'].stars).toBeGreaterThanOrEqual(1);
  }, 90000);
});
