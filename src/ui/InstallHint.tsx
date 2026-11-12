import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
}

/** „Als App installieren“ – Android/Chrome per Knopf, iPhone/Safari per Hinweis */
export function InstallHint() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const on = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const done = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', on);
    window.addEventListener('appinstalled', done);
    return () => {
      window.removeEventListener('beforeinstallprompt', on);
      window.removeEventListener('appinstalled', done);
    };
  }, []);
  const standalone = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches;
  if (standalone || installed) return null;
  return (
    <div className="rounded-2xl bg-card p-4">
      <div className="flex items-start gap-3">
        <Icon name="phone" className="mt-0.5 shrink-0 text-xp" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold">Als App installieren</div>
          <p className="text-sm text-mute">
            Funktioniert auch offline. iPhone: Teilen-Symbol → „Zum Home-Bildschirm“. Android: Browser-Menü → „App installieren“.
          </p>
          {evt && (
            <Button className="mt-3" onClick={() => void evt.prompt()}>
              <Icon name="download" size={18} /> Jetzt installieren
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
