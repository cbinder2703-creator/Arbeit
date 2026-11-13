import { useState } from 'react';
import { cloudEnabled } from './config';
import { useCloud, cloudErrorText } from './store';
import { Button } from '@/ui/Button';
import { ConfirmButton } from '@/ui/ConfirmButton';
import { Icon } from '@/ui/Icon';

const SYNC_TEXT = { idle: 'Noch nicht abgeglichen', syncing: 'Speichert …', ok: 'Gespeichert', error: 'Nicht gespeichert – keine Verbindung?' } as const;

/** Profil → Konto: wer angemeldet ist, Stand der Cloud-Speicherung, Abmelden, Konto löschen */
export function AccountSection() {
  const { status, username, sync, lastSync, syncNow, signOut, deleteAccount } = useCloud();
  const [error, setError] = useState('');
  if (!cloudEnabled || status !== 'in') return null;
  const time = lastSync ? new Date(lastSync).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : null;
  const run = async (fn: () => Promise<void>) => {
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(cloudErrorText(e));
    }
  };

  return (
    <section aria-labelledby="konto-h">
      <h2 id="konto-h" className="mb-3 mt-8 text-xl">Konto</h2>
      <div className="rounded-2xl bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-p/20 text-p-accent">
            <Icon name="user" />
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-lg" data-testid="account-name">{username}</div>
            <div className={`text-xs ${sync === 'error' ? 'text-bad' : 'text-mute'}`} role="status">
              {SYNC_TEXT[sync]}
              {sync === 'ok' && time ? ` · ${time} Uhr` : ''}
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-mute">Dein Fortschritt ist in deinem Konto gespeichert und gilt auf jedem Gerät, auf dem du dich anmeldest.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void run(syncNow)}>
            <Icon name="reset" size={18} /> Jetzt abgleichen
          </Button>
          <Button variant="secondary" onClick={() => void run(signOut)}>Abmelden</Button>
        </div>
        <div className="mt-4">
          <ConfirmButton
            label="Konto löschen"
            question="Dein Konto und der gespeicherte Fortschritt in der Cloud werden endgültig gelöscht. Das lässt sich nicht rückgängig machen."
            confirmLabel="Ja, endgültig löschen"
            onConfirm={() => run(deleteAccount)}
          />
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-bad">{error}</p>}
      </div>
    </section>
  );
}
