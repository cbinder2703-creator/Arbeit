import { useEffect, useRef } from 'react';
import { useGestures } from './useGestures';

export type { SwipeDir } from './useGestures';
import type { SwipeDir } from './useGestures';

interface Props {
  /** logische Größe (Zeichenkoordinaten) – die Anzeige skaliert auf die Breite */
  w: number;
  h: number;
  /** false → Spiel steht (es wird weiter gezeichnet, dt = 0) */
  active: boolean;
  onFrame: (dt: number, ctx: CanvasRenderingContext2D | null) => void;
  onTap?: (x: number, y: number) => void;
  onSwipe?: (dir: SwipeDir) => void;
  label: string;
  testId?: string;
  className?: string;
}

/** Zeichenfläche mit Spielschleife (requestAnimationFrame), scharf auf Handy-Displays, Tippen und Wischen */
export function Stage({ w, h, active, onFrame, onTap, onSwipe, label, testId, className = '' }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useRef(onFrame);
  frame.current = onFrame;
  const on = useRef(active);
  on.current = active;
  const gestures = useGestures(w, h, onTap, onSwipe);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      // lange Pausen (Tab im Hintergrund) nicht als einen großen Schritt zählen
      const dt = on.current ? Math.min(0.05, Math.max(0, (now - last) / 1000)) : 0;
      last = now;
      frame.current(dt, ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [w, h]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      data-testid={testId}
      className={`block w-full touch-none select-none rounded-3xl border border-line ${className}`}
      style={{ aspectRatio: `${w} / ${h}` }}
      {...gestures}
    />
  );
}
