import { AmbientLight, BufferGeometry, CanvasTexture, Color, DirectionalLight, Fog, Material, MeshBasicMaterial, MeshLambertMaterial, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer } from 'three';

/** Gibt es WebGL überhaupt? (Sehr alte Geräte / abgeschaltete Grafikbeschleunigung: nein) */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    const cut = lines.slice(0, maxLines);
    cut[maxLines - 1] = `${cut[maxLines - 1].replace(/.{0,2}$/, '')}…`;
    return cut;
  }
  return lines;
}

/** Schild mit großem Buchstaben und (umgebrochenem, ggf. gekürztem) Antworttext */
export function signTexture(letter: string, text: string, color: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(11,16,32,.88)';
  g.fillRect(8, 8, 240, 240);
  g.fillStyle = color;
  g.font = '900 76px Nunito, Inter, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(letter, 128, 54);
  g.fillStyle = '#fff';
  g.font = '700 25px Inter, system-ui, sans-serif';
  const lines = wrapLines(g, text, 220, 6);
  lines.forEach((l, i) => g.fillText(l, 128, 112 + i * 29));
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Nur ein großer Buchstabe auf farbigem, halbdurchsichtigem Grund (Zielfelder) */
export function letterTexture(letter: string, color: string): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = color;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = 'rgba(11,16,32,.9)';
  g.font = '900 88px Nunito, Inter, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(letter, 64, 70);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export interface Base3DOptions {
  fov?: number;
  bg?: string;
  fogNear?: number;
  fogFar?: number;
}

/** Gemeinsame Grundlage der 3D-Spiele: Renderer, Szene, Kamera, Licht, Aufräumen. Keine Spielregeln. */
export class Base3D {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  private disposables: { dispose(): void }[] = [];

  constructor(host: HTMLElement, w: number, h: number, o: Base3DOptions = {}) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    const el = this.renderer.domElement;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.display = 'block';
    host.appendChild(el);
    const bg = o.bg ?? '#0E1530';
    this.scene.background = new Color(bg);
    if (o.fogFar) this.scene.fog = new Fog(bg, o.fogNear ?? 20, o.fogFar);
    this.camera = new PerspectiveCamera(o.fov ?? 60, w / h, 0.1, 400);
    this.scene.add(new AmbientLight('#ffffff', 1.15));
    const sun = new DirectionalLight('#ffffff', 1.4);
    sun.position.set(4, 10, 6);
    this.scene.add(sun);
  }

  /** Merkt sich Geometrien, Materialien und Texturen zum Freigeben */
  track<T extends { dispose(): void }>(x: T): T {
    this.disposables.push(x);
    return x;
  }
  geo<T extends BufferGeometry>(g: T): T {
    return this.track(g);
  }
  mat(color: string, basic = false): Material {
    return this.track(basic ? new MeshBasicMaterial({ color }) : new MeshLambertMaterial({ color }));
  }

  resize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
