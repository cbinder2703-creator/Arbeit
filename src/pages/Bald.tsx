import { PruefungsShell } from '@/app/PruefungsShell';
import { Icon } from '@/ui/Icon';

export function Bald({ title, icon }: { title: string; icon: string }) {
  return (
    <PruefungsShell>
      <div className="mx-auto max-w-2xl px-4 pt-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-p/20 text-p-accent">
          <Icon name={icon} size={30} />
        </span>
        <h1 className="mt-4 text-3xl">{title}</h1>
        <p className="mt-2 text-mute">Dieser Bereich wird gerade gebaut.</p>
      </div>
    </PruefungsShell>
  );
}
