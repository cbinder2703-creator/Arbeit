import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { cloudEnabled } from './config';
import { useCloud, cloudErrorText } from './store';
import { MIN_PASSWORD, passwordError, usernameError } from './username';
import { Datenschutz, Impressum } from '@/pages/Rechtliches';
import { Icon } from '@/ui/Icon';
import { Button } from '@/ui/Button';

type Tab = 'login' | 'register';
type Legal = null | 'datenschutz' | 'impressum';

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-semibold" htmlFor={id}>{label}</label>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}
const INPUT = 'tap w-full rounded-2xl border-2 border-line bg-card px-4 text-[16px] outline-none focus:border-xp';

function AuthForm() {
  const signIn = useCloud((s) => s.signIn);
  const signUp = useCloud((s) => s.signUp);
  const [tab, setTab] = useState<Tab>('login');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [show, setShow] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState<Legal>(null);
  const reg = tab === 'register';

  if (legal) {
    return (
      <div className="min-h-dvh bg-bg px-5 py-8 text-ink">
        <div className="mx-auto max-w-2xl">
          <Button variant="secondary" onClick={() => setLegal(null)}>
            <Icon name="chevron-left" size={18} /> Zurück zur Anmeldung
          </Button>
          <div className="mt-6">{legal === 'datenschutz' ? <Datenschutz /> : <Impressum />}</div>
        </div>
      </div>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (reg) {
      const err = usernameError(user) ?? passwordError(pass) ?? (pass !== pass2 ? 'Die beiden Passwörter sind nicht gleich.' : !agree ? 'Bitte bestätige die Datenschutzhinweise.' : null);
      if (err) return setError(err);
    }
    setBusy(true);
    try {
      if (reg) await signUp(user, pass);
      else await signIn(user, pass);
    } catch (err2) {
      setError(cloudErrorText(err2));
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5 py-10 text-ink">
      <form onSubmit={submit} className="w-full max-w-sm" aria-label={reg ? 'Registrieren' : 'Anmeldung'} noValidate>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-xp text-[#1a1400]">
            <Icon name="rocket" size={26} />
          </span>
          <div>
            <h1 className="text-3xl leading-none">AzubiQuest</h1>
            <p className="mt-1 text-sm text-mute">{reg ? 'Konto erstellen' : 'Willkommen zurück'}</p>
          </div>
        </div>

        <div role="tablist" aria-label="Anmelden oder registrieren" className="grid grid-cols-2 rounded-2xl bg-card p-1">
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setError('');
              }}
              className={`tap rounded-xl text-sm font-bold ${tab === t ? 'bg-card-hi text-ink' : 'text-mute'}`}
            >
              {t === 'login' ? 'Anmelden' : 'Registrieren'}
            </button>
          ))}
        </div>

        <Field id="cloud-user" label="Nutzername" hint={reg ? 'Wähle einen Spitznamen, keinen Klarnamen. 3–20 Zeichen: a–z, Zahlen, . _ -' : undefined}>
          <input
            id="cloud-user"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={INPUT}
          />
        </Field>

        <Field id="cloud-pass" label="Passwort" hint={reg ? `Mindestens ${MIN_PASSWORD} Zeichen. Es gibt keine „Passwort vergessen“-Funktion – merk es dir.` : undefined}>
          <div className="relative">
            <input
              id="cloud-pass"
              type={show ? 'text' : 'password'}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete={reg ? 'new-password' : 'current-password'}
              className={`${INPUT} pr-14`}
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
        </Field>

        {reg && (
          <>
            <Field id="cloud-pass2" label="Passwort wiederholen">
              <input id="cloud-pass2" type={show ? 'text' : 'password'} value={pass2} onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" className={INPUT} />
            </Field>
            <label className="tap mt-4 flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#FACC15]" />
              <span>
                Ich habe die{' '}
                <button type="button" onClick={() => setLegal('datenschutz')} className="font-semibold text-xp underline underline-offset-2">
                  Datenschutzhinweise
                </button>{' '}
                gelesen: Mein Nutzername und mein Lernfortschritt werden in meinem Konto gespeichert.
              </span>
            </label>
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
            {error}
          </p>
        )}

        <Button type="submit" block className="mt-5" disabled={busy}>
          {busy ? 'Einen Moment …' : reg ? 'Konto erstellen' : 'Anmelden'}
        </Button>
        <p className="mt-4 flex justify-center gap-4 text-xs text-mute">
          <button type="button" className="tap underline underline-offset-2" onClick={() => setLegal('datenschutz')}>Datenschutz</button>
          <button type="button" className="tap underline underline-offset-2" onClick={() => setLegal('impressum')}>Impressum</button>
        </p>
      </form>
    </div>
  );
}

/** Mit Cloud-Konten: ohne Anmeldung kein Zugang. Ohne Cloud-Einstellung passiert nichts (Inhalt bleibt wie bisher). */
export function CloudGate({ children }: { children: ReactNode }) {
  const status = useCloud((s) => s.status);
  const init = useCloud((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);

  if (!cloudEnabled) return <>{children}</>;
  if (status === 'in') return <>{children}</>;
  if (status === 'init') {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-mute" role="status">
        Lädt …
      </div>
    );
  }
  return <AuthForm />;
}
