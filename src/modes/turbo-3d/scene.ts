import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  ConeGeometry,
} from 'three';
import type { BufferGeometry, Material, Object3D, Texture } from 'three';
import type { Round } from '@/engine/laneRun';
import { CHOICE_COLORS, LETTERS } from '@/ui/game/colors';

export const LANE_W = 2.4;

/** Gibt es WebGL überhaupt? (Sehr alte Geräte / abgeschaltete Grafikbeschleunigung: nein) */
export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const laneX = (lane: number, lanes: number) => (lane - (lanes - 1) / 2) * LANE_W;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
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

function signTexture(letter: string, text: string, color: string): CanvasTexture {
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
  const lines = wrap(g, text, 220, 6);
  lines.forEach((l, i) => g.fillText(l, 128, 112 + i * 29));
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Die 3D-Szene des Turbo-Rennens: Straße, Auto, Hindernisse, Antwort-Tor. Kein React, keine Spielregeln. */
export class RaceScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private car = new Group();
  private road = new Group();
  private dynamic = new Group(); // pro Frage neu: Hindernisse + Tor
  private obstacles: Mesh[] = [];
  private gate = new Group();
  private dashes: Mesh[] = [];
  private trees: Object3D[] = [];
  private scroll = 0;
  private carX = 0;
  private shake = 0;
  private disposables: { dispose(): void }[] = [];

  constructor(host: HTMLElement, w: number, h: number) {
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    const el = this.renderer.domElement;
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.display = 'block';
    host.appendChild(el);

    this.scene.background = new Color('#0E1530');
    this.scene.fog = new Fog('#0E1530', 28, 95);
    this.camera = new PerspectiveCamera(62, w / h, 0.1, 140);
    this.camera.position.set(0, 3.4, 6.4);
    this.camera.lookAt(0, 0.9, -9);

    this.scene.add(new AmbientLight('#ffffff', 1.15));
    const sun = new DirectionalLight('#ffffff', 1.4);
    sun.position.set(4, 10, 6);
    this.scene.add(sun);

    this.buildCar();
    this.scene.add(this.road, this.dynamic, this.car);
    this.dynamic.add(this.gate);

    // Seitenstreifen (Gras) und Bäume – bewegen sich mit
    const grass = this.mat('#1F4D33');
    for (const s of [-1, 1]) {
      const m = new Mesh(this.geo(new PlaneGeometry(60, 400)), grass);
      m.rotation.x = -Math.PI / 2;
      m.position.set(s * (30 + 6), -0.02, -150);
      this.scene.add(m);
    }
    const trunk = this.mat('#6B4423');
    const leaf = this.mat('#2E7D4F');
    const trunkG = this.geo(new CylinderGeometry(0.18, 0.22, 1.2, 6));
    const leafG = this.geo(new ConeGeometry(1.1, 2.6, 7));
    for (let i = 0; i < 28; i++) {
      const t = new Group();
      const a = new Mesh(trunkG, trunk);
      a.position.y = 0.6;
      const b = new Mesh(leafG, leaf);
      b.position.y = 2.3;
      t.add(a, b);
      this.scene.add(t);
      this.trees.push(t);
    }
  }

  private geo<T extends BufferGeometry>(g: T): T {
    this.disposables.push(g);
    return g;
  }
  private mat(color: string, basic = false): Material {
    const m = basic ? new MeshBasicMaterial({ color }) : new MeshLambertMaterial({ color });
    this.disposables.push(m);
    return m;
  }

  private buildCar(): void {
    const body = new Mesh(this.geo(new BoxGeometry(1.5, 0.55, 2.8)), this.mat('#F97316'));
    body.position.y = 0.55;
    const cabin = new Mesh(this.geo(new BoxGeometry(1.2, 0.5, 1.3)), this.mat('#FDBA74'));
    cabin.position.set(0, 1.05, 0.2);
    const wheelG = this.geo(new CylinderGeometry(0.34, 0.34, 0.3, 12));
    const wheelM = this.mat('#111827');
    for (const [x, z] of [[-0.8, -0.9], [0.8, -0.9], [-0.8, 0.9], [0.8, 0.9]]) {
      const w = new Mesh(wheelG, wheelM);
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.34, z);
      this.car.add(w);
    }
    const light = this.mat('#FEF08A', true);
    const lg = this.geo(new BoxGeometry(0.3, 0.16, 0.06));
    for (const x of [-0.5, 0.5]) {
      const l = new Mesh(lg, light);
      l.position.set(x, 0.6, -1.42);
      this.car.add(l);
    }
    this.car.add(body, cabin);
  }

  private clearDynamic(): void {
    for (const o of this.obstacles) this.dynamic.remove(o);
    this.obstacles = [];
    this.gate.clear();
    for (const m of this.dashes) this.road.remove(m);
    this.dashes = [];
    this.road.clear();
  }

  /** Neue Frage: Straße mit `lanes` Spuren, Hindernisse und Antwort-Tor aufbauen */
  setRound(round: Round, choices: string[]): void {
    this.clearDynamic();
    const n = round.lanes;
    const width = n * LANE_W;
    const asphalt = new Mesh(this.geo(new PlaneGeometry(width, 400)), this.mat('#252B45'));
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.position.set(0, 0, -150);
    this.road.add(asphalt);
    // Randlinien + gestrichelte Trennlinien
    const edgeM = this.mat('#E2E8F0', true);
    for (const s of [-1, 1]) {
      const e = new Mesh(this.geo(new BoxGeometry(0.12, 0.02, 400)), edgeM);
      e.position.set((s * width) / 2, 0.01, -150);
      this.road.add(e);
    }
    const dashG = this.geo(new BoxGeometry(0.12, 0.02, 2.4));
    for (let l = 1; l < n; l++) {
      for (let k = 0; k < 14; k++) {
        const d = new Mesh(dashG, edgeM);
        d.position.set(laneX(l, n) - LANE_W / 2, 0.012, 0);
        d.userData.k = k;
        this.road.add(d);
        this.dashes.push(d);
      }
    }
    // Hindernisse: orange-weiße Kisten
    const crate = this.geo(new BoxGeometry(LANE_W * 0.7, 1, 1.2));
    const crateM = this.mat('#EF6C00');
    const stripeG = this.geo(new BoxGeometry(LANE_W * 0.72, 0.22, 1.22));
    const stripeM = this.mat('#FFF7ED');
    for (const o of round.obstacles) {
      const m = new Mesh(crate, crateM);
      const s = new Mesh(stripeG, stripeM);
      s.position.y = 0.1;
      m.add(s);
      m.position.set(laneX(o.lane, n), 0.5, -o.d);
      this.dynamic.add(m);
      this.obstacles.push(m);
    }
    // Tor: farbige Matte + Schild pro Spur, zwei Pfeiler und Querbalken
    const pill = this.mat('#CBD5E1');
    for (const s of [-1, 1]) {
      const p = new Mesh(this.geo(new BoxGeometry(0.4, 6.2, 0.4)), pill);
      p.position.set((s * (width + 0.8)) / 2, 3.1, 0);
      this.gate.add(p);
    }
    const beam = new Mesh(this.geo(new BoxGeometry(width + 1.2, 0.4, 0.4)), pill);
    beam.position.set(0, 6.2, 0);
    this.gate.add(beam);
    for (let i = 0; i < n; i++) {
      const tex = signTexture(LETTERS[i], choices[i] ?? '', CHOICE_COLORS[i]);
      this.disposables.push(tex as Texture);
      const sign = new Mesh(this.geo(new PlaneGeometry(LANE_W * 0.94, LANE_W * 0.94)), new MeshBasicMaterial({ map: tex }));
      this.disposables.push(sign.material as Material);
      sign.position.set(laneX(i, n), 4.6, 0.05);
      this.gate.add(sign);
      const mat = new Mesh(this.geo(new PlaneGeometry(LANE_W * 0.96, 5)), this.mat(CHOICE_COLORS[i], true));
      mat.rotation.x = -Math.PI / 2;
      mat.position.set(laneX(i, n), 0.03, 2.5);
      (mat.material as MeshBasicMaterial).transparent = true;
      (mat.material as MeshBasicMaterial).opacity = 0.55;
      this.gate.add(mat);
    }
    this.carX = laneX(round.lane, n);
    this.update(round, 0, 0);
  }

  /** Bewegung + Zeichnen eines Bildes */
  update(round: Round, dt: number, boost: number): void {
    const n = round.lanes;
    this.scroll += round.speed * dt;
    const targetX = laneX(round.lane, n);
    this.carX += (targetX - this.carX) * Math.min(1, dt * 12 + (dt === 0 ? 1 : 0));
    this.car.position.set(this.carX, 0, 0);
    this.car.rotation.z = -(targetX - this.carX) * 0.08;
    this.car.rotation.y = -(targetX - this.carX) * 0.12;
    round.obstacles.forEach((o, i) => {
      const m = this.obstacles[i];
      if (!m) return;
      m.position.z = -o.d;
      m.visible = o.d > -8;
      m.rotation.y = o.hit ? this.scroll * 4 : 0;
      m.position.y = o.hit ? 0.5 + Math.abs(Math.sin(this.scroll * 3)) * 0.8 : 0.5;
    });
    this.gate.position.z = -round.gate;
    this.gate.visible = round.resolved === null || round.gate > -12;
    // laufende Strichlinien und Bäume
    for (const d of this.dashes) d.position.z = ((((d.userData.k as number) * 8 + this.scroll) % 112) + 112) % 112 - 100;
    this.trees.forEach((t, i) => {
      const side = i % 2 ? 1 : -1;
      t.position.set(side * (n * LANE_W * 0.5 + 3 + ((i * 7) % 9)), 0, ((((Math.floor(i / 2)) * 8 + this.scroll * 1) % 112) + 112) % 112 - 100);
    });
    this.shake = Math.max(0, this.shake - dt * 3);
    this.camera.position.x = (this.carX * 0.55) + (Math.random() - 0.5) * this.shake * 0.5;
    this.camera.position.y = 3.4 + (Math.random() - 0.5) * this.shake * 0.4;
    this.camera.lookAt(this.carX * 0.25, 0.9, -9);
    const fov = 62 + boost * 1.6;
    if (Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov += (fov - this.camera.fov) * Math.min(1, dt * 4);
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
  }

  hit(): void {
    this.shake = 1;
  }

  resize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
