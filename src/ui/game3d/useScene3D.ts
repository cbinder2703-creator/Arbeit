import { useEffect, useRef, useState } from 'react';
import { webglAvailable } from './webgl';

interface Scene3D {
  dispose(): void;
  resize(w: number, h: number): void;
}

/**
 * Baut eine 3D-Szene in einem Host-Element auf, ruft pro Bild `tick(dt)` auf und räumt beim Verlassen auf.
 * `unsupported` ist wahr, wenn WebGL fehlt oder die Szene nicht erzeugt werden konnte.
 * `enabled` = false → Szene wird abgebaut (z. B. Endbildschirm).
 */
export function useScene3D<S extends Scene3D>(create: (host: HTMLElement, w: number, h: number) => S, tick: (scene: S, dt: number) => void, enabled = true) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<S | null>(null);
  const [unsupported, setUnsupported] = useState(() => !webglAvailable());
  const createRef = useRef(create);
  createRef.current = create;
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (unsupported || !enabled || !host.current) return;
    const el = host.current;
    const size = () => [el.clientWidth || 360, el.clientHeight || 288] as const;
    try {
      scene.current = createRef.current(el, ...size());
    } catch {
      scene.current = null;
      setUnsupported(true);
      return;
    }
    const onResize = () => scene.current?.resize(...size());
    window.addEventListener('resize', onResize);
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const s = scene.current;
      if (s) tickRef.current(s, Math.min(0.05, Math.max(0, (now - last) / 1000)));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [unsupported, enabled]);

  return { host, scene, unsupported };
}
