import { useRef } from 'react';
import type { PointerEvent } from 'react';

export type SwipeDir = 'up' | 'down' | 'left' | 'right';

/**
 * Tippen und Wischen für Spielflächen (Maus, Finger, Stift). `x`/`y` sind in der logischen Größe w × h der Fläche.
 * Wischen = mindestens 22 px Bewegung, die Hauptrichtung zählt.
 */
export function useGestures(w: number, h: number, onTap?: (x: number, y: number) => void, onSwipe?: (dir: SwipeDir) => void) {
  const down = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      down.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const d = down.current;
      down.current = null;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.hypot(dx, dy) < 22) {
        const r = e.currentTarget.getBoundingClientRect();
        onTap?.(((e.clientX - r.left) / (r.width || 1)) * w, ((e.clientY - r.top) / (r.height || 1)) * h);
      } else onSwipe?.(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    },
    onPointerCancel: () => {
      down.current = null;
    },
  };
}
