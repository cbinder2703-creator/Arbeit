import type { CSSProperties, ReactNode } from 'react';
import type { PruefungMeta } from '@/content/schema';
import { hexToRgbTriplet, shade } from './theme';
import { patternFor } from './themes';

export function themeStyle(m: Pick<PruefungMeta, 'color' | 'accent' | 'theme'>): CSSProperties {
  return {
    ['--p-rgb' as string]: hexToRgbTriplet(m.color),
    ['--p-accent-rgb' as string]: hexToRgbTriplet(m.accent),
    ['--p-color' as string]: m.color,
    ['--p-accent' as string]: m.accent,
    ['--p-dark' as string]: shade(m.color, 0.55),
    ['--p-pattern' as string]: patternFor(m.theme),
  };
}

/** Setzt Farben/Muster einer Prüfung als CSS-Variablen für alles darunter */
export function PruefungsTheme({ meta, children, className = '' }: { meta: PruefungMeta; children: ReactNode; className?: string }) {
  return (
    <div style={themeStyle(meta)} className={`min-h-dvh bg-bg text-ink ${className}`} data-pruefung={meta.id}>
      {children}
    </div>
  );
}
