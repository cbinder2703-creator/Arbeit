import type { ReactNode } from 'react';

/** Rahmen für alle Modi: Vollbild, Inhalt zentriert (mobil volle Breite, PC bis 768 px) */
export function ModeFrame({ children, padBottom = false }: { children: ReactNode; padBottom?: boolean }) {
  return (
    <div className="min-h-dvh overflow-x-clip bg-bg">
      <div className={`mx-auto flex min-h-dvh w-full max-w-3xl flex-col ${padBottom ? 'pb-72' : ''}`}>{children}</div>
    </div>
  );
}
