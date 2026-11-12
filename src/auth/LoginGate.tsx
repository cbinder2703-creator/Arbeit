import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { checkLogin } from './hash';
import type { AuthConfig } from './hash';
import { Icon } from '@/ui/Icon';
import { Button } from '@/ui/Button';

const KEY = 'azubiquest-auth';

/** Login ist aktiv, wenn beim Bauen AZUBI_LOGIN_USER/AZUBI_LOGIN_PASS gesetzt waren (siehe docs/LOGIN.md) */
export const authConfig: AuthConfig | null = typeof __AUTH_CONFIG__ === 'undefined' ? null : __AUTH_CONFIG__;
export const authRequired = authConfig !== null;

const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function logout(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* egal */
  }
  location.reload();
}

/** Zeigt die Anmeldung, bis Nutzername und Passwort stimmen; danach bleibt man auf diesem Gerät angemeldet */
export function LoginGate({ children, config = authConfig }: { children: ReactNode; config?: AuthConfig | null }) {
  const [ok, setOk] = useState(() => !config || read() === config.hash);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);

  if (ok || !config) return <>{children}</>;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    if (fails >= 3) await new Promise((r) => setTimeout(r, Math.min(8000, 1000 * (fails - 2)))); // bremst Durchprobieren
    const good = await checkLogin(config, user, pass).catch(() => false);
    if (good) {
      try {
        localStorage.setItem(KEY, config.hash);
      } catch {
        /* Anmeldung gilt dann nur bis zum Neuladen */
      }
      setOk(true);
      return;
    }
    setFails((n) => n + 1);
    setError('Nutzername oder Passwort stimmt nicht.');
    setBusy(false);
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5 py-10 text-ink">
      <form onSubmit={submit} className="w-full max-w-sm" aria-label="Anmeldung">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-xp text-[#1a1400]">
            <Icon name="rocket" size={26} />
          </span>
          <div>
            <h1 className="text-3xl leading-none">AzubiQuest</h1>
            <p className="mt-1 text-sm text-mute">Bitte melde dich an.</p>
          </div>
        </div>

        <label className="block text-sm font-semibold" htmlFor="login-user">Nutzername</label>
        <input
          id="login-user"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          className="tap mt-1 w-full rounded-2xl border-2 border-line bg-card px-4 text-[16px] outline-none focus:border-xp"
        />

        <label className="mt-4 block text-sm font-semibold" htmlFor="login-pass">Passwort</label>
        <div className="relative mt-1">
          <input
            id="login-pass"
            type={show ? 'text' : 'password'}
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
            required
            className="tap w-full rounded-2xl border-2 border-line bg-card px-4 pr-14 text-[16px] outline-none focus:border-xp"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Passwort verbergen' : 'Passwort anzeigen'}
            aria-pressed={show}
            className="tap absolute right-1 top-0 grid place-items-center rounded-xl text-mute hover:text-ink"
          >
            <Icon name="eye" size={20} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
            {error}
          </p>
        )}

        <Button type="submit" block className="mt-5" disabled={busy}>
          {busy ? 'Prüfe …' : 'Anmelden'}
        </Button>
        <p className="mt-4 text-center text-xs text-mute">Den Zugang bekommst du von der Person, die dir den Link gegeben hat.</p>
      </form>
    </div>
  );
}
