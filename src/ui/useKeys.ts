import { useEffect, useRef } from 'react';

/** Tastatur-Kürzel (PC): ein Handler für alle keydown-Ereignisse; Eingabefelder werden ignoriert */
export function useKeys(handler: (e: KeyboardEvent) => void, enabled = true): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      ref.current(e);
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [enabled]);
}
