import { useState } from 'react';
import { Button } from './Button';

/** Zweistufiger Knopf („Wirklich?“) – ohne window.confirm, das in Apps oft blockiert ist */
export function ConfirmButton({
  label,
  question,
  confirmLabel,
  onConfirm,
  variant = 'danger',
  disabled,
}: {
  label: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  variant?: 'danger' | 'secondary';
  disabled?: boolean;
}) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ask) {
    return (
      <Button variant={variant} disabled={disabled} onClick={() => setAsk(true)}>
        {label}
      </Button>
    );
  }
  return (
    <div role="alertdialog" aria-label={label} className="rounded-2xl border border-bad/40 bg-bad/10 p-3">
      <p className="text-sm">{question}</p>
      <div className="mt-3 flex gap-2">
        <Button
          variant="danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
            } finally {
              setBusy(false);
              setAsk(false);
            }
          }}
        >
          {busy ? 'Einen Moment …' : confirmLabel}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => setAsk(false)}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
