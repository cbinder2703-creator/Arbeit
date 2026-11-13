import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Cloud „einschalten“ (die echten Werte stehen nicht im Test)
vi.mock('./config', () => ({ cloudEnabled: true, SUPABASE_URL: 'https://test.supabase.co', SUPABASE_KEY: 'k'.repeat(40) }));

import { CloudGate } from './CloudGate';
import { AccountSection } from './AccountSection';
import { useCloud, resetCloudForTests } from './store';
import { CloudError, setCloudApi } from './api';
import type { CloudApi, CloudUser } from './api';
import { normalizeUsername } from './username';
import { useProgress } from '@/store/progress';

/** Falscher Server im Speicher: Nutzernamen eindeutig, Daten je Konto, Sitzung pro „Gerät“ */
class FakeServer {
  users = new Map<string, { id: string; pass: string }>();
  data = new Map<string, unknown>();
  pushes = 0;
  offline = false;
  device(): CloudApi & { session: CloudUser | null } {
    const srv = this;
    let session: CloudUser | null = null;
    const check = () => {
      if (srv.offline) throw new CloudError('network');
    };
    return {
      get session() { return session; },
      async getSession() { return session; },
      async signUp(username, password) {
        check();
        const n = normalizeUsername(username);
        if (srv.users.has(n)) throw new CloudError('exists');
        const id = `id-${srv.users.size + 1}`;
        srv.users.set(n, { id, pass: password });
        session = { userId: id, username: n };
        return session;
      },
      async signIn(username, password) {
        check();
        const n = normalizeUsername(username);
        const u = srv.users.get(n);
        if (!u || u.pass !== password) throw new CloudError('credentials');
        session = { userId: u.id, username: n };
        return session;
      },
      async signOut() { session = null; },
      async pull() { check(); return session ? (srv.data.get(session.userId) ?? null) : null; },
      async push(d) { check(); srv.pushes++; srv.data.set(session!.userId, JSON.parse(JSON.stringify(d))); },
      async deleteAccount() { check(); srv.users.delete(session!.username); srv.data.delete(session!.userId); session = null; },
    };
  }
}

const Inner = () => <p>Geheimer Inhalt <AccountSection /></p>;
const mount = () => render(<CloudGate><Inner /></CloudGate>);
const asJson = () => JSON.parse(JSON.stringify(useProgress.getState().byPruefung));

beforeEach(() => {
  localStorage.clear();
  useProgress.setState({ byPruefung: {}, globalStreak: 0, bestGlobalStreak: 0, globalLastDay: null, globalResetAt: 0 });
  resetCloudForTests();
});
afterEach(() => {
  resetCloudForTests();
  setCloudApi(null);
  vi.useRealTimers();
});

async function register(user: ReturnType<typeof userEvent.setup>, name: string, pass: string) {
  await user.click(await screen.findByRole('tab', { name: 'Registrieren' }));
  await user.type(screen.getByLabelText('Nutzername'), name);
  await user.type(screen.getByLabelText('Passwort'), pass);
  await user.type(screen.getByLabelText('Passwort wiederholen'), pass);
  await user.click(screen.getByRole('checkbox'));
  await user.click(screen.getByRole('button', { name: 'Konto erstellen' }));
}

describe('Konto: Registrieren und Anmelden', () => {
  it('ohne Anmeldung sieht man nur die Anmeldeseite', async () => {
    setCloudApi(new FakeServer().device());
    mount();
    expect(await screen.findByRole('form', { name: 'Anmeldung' })).toBeInTheDocument();
    expect(screen.queryByText(/Geheimer Inhalt/)).toBeNull();
  });

  it('Registrieren prüft Name, Passwort, Wiederholung und Datenschutz-Haken', async () => {
    setCloudApi(new FakeServer().device());
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('tab', { name: 'Registrieren' }));
    await user.type(screen.getByLabelText('Nutzername'), 'mäx');
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Erlaubt sind nur/);
    await user.clear(screen.getByLabelText('Nutzername'));
    await user.type(screen.getByLabelText('Nutzername'), 'max');
    await user.type(screen.getByLabelText('Passwort'), 'kurz');
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/mindestens 8/);
    await user.clear(screen.getByLabelText('Passwort'));
    await user.type(screen.getByLabelText('Passwort'), 'langes-passwort');
    await user.type(screen.getByLabelText('Passwort wiederholen'), 'anderes-passwort');
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/nicht gleich/);
    await user.clear(screen.getByLabelText('Passwort wiederholen'));
    await user.type(screen.getByLabelText('Passwort wiederholen'), 'langes-passwort');
    await user.click(screen.getByRole('button', { name: 'Konto erstellen' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Datenschutzhinweise/);
  });

  it('derselbe Nutzername darf nicht zweimal vergeben werden – auch nicht in anderer Schreibweise', async () => {
    const srv = new FakeServer();
    setCloudApi(srv.device());
    const user = userEvent.setup();
    const first = mount();
    await register(user, 'Max', 'passwort-123');
    await screen.findByText(/Geheimer Inhalt/);
    first.unmount();
    resetCloudForTests();

    setCloudApi(srv.device()); // anderes Gerät
    mount();
    await register(user, ' MAX ', 'anderes-passwort');
    expect(await screen.findByRole('alert')).toHaveTextContent('Diesen Nutzernamen gibt es schon');
    expect(screen.queryByText(/Geheimer Inhalt/)).toBeNull();
    expect(srv.users.size).toBe(1);
  });

  it('Anmelden: falsches Passwort → Fehler, richtiges → drin', async () => {
    const srv = new FakeServer();
    await srv.device().signUp('lena', 'passwort-123');
    setCloudApi(srv.device());
    const user = userEvent.setup();
    mount();
    await user.type(await screen.findByLabelText('Nutzername'), 'Lena');
    await user.type(screen.getByLabelText('Passwort'), 'falsch-falsch');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nutzername oder Passwort stimmt nicht');
    await user.clear(screen.getByLabelText('Passwort'));
    await user.type(screen.getByLabelText('Passwort'), 'passwort-123');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));
    expect(await screen.findByText(/Geheimer Inhalt/)).toBeInTheDocument();
  });

  it('Datenschutz ist vor der Anmeldung lesbar', async () => {
    setCloudApi(new FakeServer().device());
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole('button', { name: 'Datenschutz' }));
    expect(screen.getByRole('heading', { name: 'Datenschutz' })).toBeInTheDocument();
    expect(screen.getByText(/Supabase/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Zurück zur Anmeldung/ }));
    expect(screen.getByRole('form', { name: 'Anmeldung' })).toBeInTheDocument();
  });
});

describe('Konto: Fortschritt in der Cloud', () => {
  const xp = (n: number) => useProgress.getState().addXp('p1', n);

  it('der bisherige Stand vom Gerät wird beim Registrieren ins Konto übernommen', async () => {
    xp(120);
    useProgress.getState().recordAnswer('p1', 'i1', true, '2026-01-01');
    const srv = new FakeServer();
    setCloudApi(srv.device());
    const user = userEvent.setup();
    mount();
    await register(user, 'tom', 'passwort-123');
    await screen.findByText(/Geheimer Inhalt/);
    await waitFor(() => expect(srv.data.size).toBe(1));
    const saved = [...srv.data.values()][0] as { byPruefung: Record<string, { xp: number; leitner: object }> };
    expect(saved.byPruefung.p1.xp).toBe(120);
    expect(Object.keys(saved.byPruefung.p1.leitner)).toEqual(['i1']);
  });

  it('zweites Gerät: Anmelden holt den Fortschritt und führt ihn mit dem lokalen Stand zusammen', async () => {
    const srv = new FakeServer();
    const dev1 = srv.device();
    await dev1.signUp('mia', 'passwort-123');
    await dev1.push({ v: 1, byPruefung: { p1: { ...asJson().p1, xp: 300, badges: ['b1'], leitner: {}, bestScores: {}, bestTimes: {}, daily: {}, lessons: {}, streak: 0, bestStreak: 0, lastDay: null, bestGrade: null, bestPercent: null, examAttempts: 0, rounds: 0, resetAt: 0 } }, globalStreak: 0, bestGlobalStreak: 0, globalLastDay: null });
    useProgress.setState({ byPruefung: {} });

    setCloudApi(srv.device());
    const user = userEvent.setup();
    mount();
    await user.type(await screen.findByLabelText('Nutzername'), 'mia');
    await user.type(screen.getByLabelText('Passwort'), 'passwort-123');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));
    await screen.findByText(/Geheimer Inhalt/);
    await waitFor(() => expect(useProgress.getState().byPruefung.p1?.xp).toBe(300));
    expect(useProgress.getState().byPruefung.p1.badges).toEqual(['b1']);
  });

  it('Änderungen werden nach kurzer Zeit automatisch gespeichert (gebündelt)', async () => {
    const srv = new FakeServer();
    setCloudApi(srv.device());
    const user = userEvent.setup();
    mount();
    await register(user, 'ben', 'passwort-123');
    await screen.findByText(/Geheimer Inhalt/);
    await waitFor(() => expect(srv.pushes).toBeGreaterThan(0));
    const before = srv.pushes;
    vi.useFakeTimers();
    act(() => { xp(10); xp(10); xp(10); });
    expect(srv.pushes).toBe(before); // noch nicht
    await act(async () => { await vi.advanceTimersByTimeAsync(4500); });
    expect(srv.pushes).toBe(before + 1); // ein gebündelter Upload
    expect((srv.data.get('id-1') as { byPruefung: { p1: { xp: number } } }).byPruefung.p1.xp).toBe(30);
  });

  it('ohne Verbindung geht nichts verloren: Zustand „Nicht gespeichert“, Stand bleibt auf dem Gerät', async () => {
    const srv = new FakeServer();
    setCloudApi(srv.device());
    const user = userEvent.setup();
    mount();
    await register(user, 'eva', 'passwort-123');
    await screen.findByText(/Geheimer Inhalt/);
    srv.offline = true;
    xp(50);
    await act(async () => { await useCloud.getState().syncNow().catch(() => {}); });
    expect(useCloud.getState().sync).toBe('error');
    expect(useProgress.getState().byPruefung.p1.xp).toBe(50);
  });

  it('anderes Konto auf demselben Handy: der Stand des vorherigen Kontos wird nicht übernommen', async () => {
    const srv = new FakeServer();
    const user = userEvent.setup();
    setCloudApi(srv.device());
    const m1 = mount();
    await register(user, 'anna', 'passwort-123');
    await screen.findByText(/Geheimer Inhalt/);
    xp(500);
    await user.click(await screen.findByRole('button', { name: 'Abmelden' }));
    await screen.findByRole('form', { name: 'Anmeldung' });
    expect(useProgress.getState().byPruefung).toEqual({}); // vom Gerät entfernt
    m1.unmount();
    resetCloudForTests();

    // ein weiteres Konto: startet bei 0
    setCloudApi(srv.device());
    mount();
    await register(user, 'bob', 'passwort-123');
    await screen.findByText(/Geheimer Inhalt/);
    expect(useProgress.getState().byPruefung.p1?.xp ?? 0).toBe(0);
    // Annas Stand ist in ihrem Konto gespeichert
    expect((srv.data.get('id-1') as { byPruefung: { p1: { xp: number } } }).byPruefung.p1.xp).toBe(500);
  });

  it('Konto löschen entfernt Konto und Daten', async () => {
    const srv = new FakeServer();
    setCloudApi(srv.device());
    const user = userEvent.setup();
    mount();
    await register(user, 'zoe', 'passwort-123');
    await screen.findByText(/Geheimer Inhalt/);
    await user.click(screen.getByRole('button', { name: 'Konto löschen' }));
    await user.click(screen.getByRole('button', { name: 'Ja, endgültig löschen' }));
    await screen.findByRole('form', { name: 'Anmeldung' });
    expect(srv.users.size).toBe(0);
    expect(srv.data.size).toBe(0);
  });

  it('Profil zeigt Namen und Speicherstand', async () => {
    setCloudApi(new FakeServer().device());
    const user = userEvent.setup();
    mount();
    await register(user, 'kim', 'passwort-123');
    expect(await screen.findByTestId('account-name')).toHaveTextContent('kim');
    await waitFor(() => expect(screen.getByRole('status', { name: '' })).toBeTruthy());
  });
});
