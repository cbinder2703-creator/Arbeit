import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { checkLogin, makeAuthConfig } from './hash';
import type { AuthConfig } from './hash';
import { LoginGate } from './LoginGate';

let cfg: AuthConfig;
beforeAll(async () => {
  cfg = await makeAuthConfig('Klasse10', 'geheim123', 1000); // wenige Runden: schneller Test
});
beforeEach(() => localStorage.clear());

describe('Prüfsumme', () => {
  it('speichert kein Klartext-Passwort und ist gesalzen', async () => {
    expect(JSON.stringify(cfg)).not.toMatch(/geheim123|klasse10/i);
    const other = await makeAuthConfig('Klasse10', 'geheim123', 1000);
    expect(other.hash).not.toBe(cfg.hash); // anderes Salz
  });
  it('Nutzername egal ob groß/klein, Passwort exakt', async () => {
    expect(await checkLogin(cfg, 'klasse10', 'geheim123')).toBe(true);
    expect(await checkLogin(cfg, '  KLASSE10 ', 'geheim123')).toBe(true);
    expect(await checkLogin(cfg, 'klasse10', 'Geheim123')).toBe(false);
    expect(await checkLogin(cfg, 'jemand', 'geheim123')).toBe(false);
    expect(await checkLogin(cfg, 'klasse10', '')).toBe(false);
  });
});

describe('Anmeldung', () => {
  const open = (config: AuthConfig | null = cfg) => render(<LoginGate config={config}><p>Geheimer Inhalt</p></LoginGate>);

  it('ohne Login-Einstellung ist alles offen', () => {
    open(null);
    expect(screen.getByText('Geheimer Inhalt')).toBeInTheDocument();
  });

  it('falsches Passwort → Fehlermeldung, Inhalt bleibt verborgen', async () => {
    const user = userEvent.setup();
    open();
    expect(screen.queryByText('Geheimer Inhalt')).toBeNull();
    await user.type(screen.getByLabelText('Nutzername'), 'klasse10');
    await user.type(screen.getByLabelText('Passwort'), 'falsch');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nutzername oder Passwort stimmt nicht');
    expect(screen.queryByText('Geheimer Inhalt')).toBeNull();
  });

  it('richtige Daten → Inhalt sichtbar, bleibt nach Neuladen angemeldet', async () => {
    const user = userEvent.setup();
    const first = open();
    await user.type(screen.getByLabelText('Nutzername'), 'Klasse10');
    await user.type(screen.getByLabelText('Passwort'), 'geheim123');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));
    await waitFor(() => expect(screen.getByText('Geheimer Inhalt')).toBeInTheDocument());
    first.unmount();
    open(); // „Neuladen“
    expect(screen.getByText('Geheimer Inhalt')).toBeInTheDocument();
  });

  it('neues Passwort (andere Prüfsumme) meldet alle wieder ab', async () => {
    localStorage.setItem('azubiquest-auth', cfg.hash);
    const changed = await makeAuthConfig('Klasse10', 'neu456', 1000);
    open(changed);
    expect(screen.queryByText('Geheimer Inhalt')).toBeNull();
  });

  it('Passwort lässt sich anzeigen', async () => {
    const user = userEvent.setup();
    open();
    expect(screen.getByLabelText('Passwort')).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Passwort anzeigen' }));
    expect(screen.getByLabelText('Passwort')).toHaveAttribute('type', 'text');
  });
});
