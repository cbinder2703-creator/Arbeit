import { BoxGeometry, CanvasTexture, CylinderGeometry, DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, RepeatWrapping, SphereGeometry, SRGBColorSpace, Vector2 } from 'three';
import { Base3D, letterTexture } from '@/ui/game3d/webgl';
import { CHOICE_COLORS, LETTERS } from '@/ui/game/colors';
import { zonePositions } from '@/engine/zones';

export const GOAL_Z = -9;
// Das Tor ist gegenüber dem echten Maß (7,32 × 2,44 m) vergrößert, damit die Felder am Handy gut zu treffen sind
const GOAL_W = 9;
const GOAL_H = 3.2;
const SHOT_S = 0.8;
const TOTAL_S = 1.9;

/** Mitte eines Antwort-Feldes im Tor (Weltkoordinaten) */
export function zoneWorld(i: number, n: number): { x: number; y: number } {
  const z = zonePositions(n)[i];
  return { x: z.x * GOAL_W * 0.7, y: GOAL_H / 2 + z.y * 1.15 };
}

function netTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(255,255,255,.85)';
  g.lineWidth = 3;
  g.strokeRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  return t;
}

interface Anim {
  t: number;
  idx: number;
  goal: boolean;
  keeper: number;
  n: number;
  done: () => void;
  finished: boolean;
}

/** 3D-Szene des Elfmeters: Rasen, Tor mit Netz, Torwart, Ball und vier (bzw. 2–3) Antwort-Felder im Tor */
export class PenaltyScene extends Base3D {
  private zoneGroup = new Group();
  private zoneMeshes: Mesh[] = [];
  private ball: Mesh;
  private keeper = new Group();
  private armL = new Group();
  private armR = new Group();
  private anim: Anim | null = null;
  private clock = 0;
  private shake = 0;
  private raycaster = new Raycaster();

  constructor(host: HTMLElement, w: number, h: number) {
    super(host, w, h, { fov: 55, bg: '#0B1630', fogNear: 35, fogFar: 95 });
    this.camera.position.set(0, 2.0, 3.6);
    this.camera.lookAt(0, 1.0, GOAL_Z);
    const s = this.scene;

    // Rasen in Streifen
    for (let i = 0; i < 10; i++) {
      const m = new Mesh(this.geo(new PlaneGeometry(70, 9)), this.mat(i % 2 ? '#1E6B3A' : '#237A43'));
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, 0, GOAL_Z - 9 + i * 9);
      s.add(m);
    }
    // Linien
    const white = this.mat('#FFFFFF', true);
    const line = (x: number, z: number, w: number, d: number) => {
      const m = new Mesh(this.geo(new PlaneGeometry(w, d)), white);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.01, z);
      s.add(m);
    };
    line(0, GOAL_Z, 40, 0.14);
    line(0, GOAL_Z + 5.5, 18.3, 0.14);
    line(-9.15, GOAL_Z + 2.75, 0.14, 5.5);
    line(9.15, GOAL_Z + 2.75, 0.14, 5.5);
    line(0, GOAL_Z + 16.5, 40.3, 0.14);
    line(-20.15, GOAL_Z + 8.25, 0.14, 16.5);
    line(20.15, GOAL_Z + 8.25, 0.14, 16.5);
    const spot = new Mesh(this.geo(new CylinderGeometry(0.15, 0.15, 0.02, 16)), white);
    spot.position.set(0, 0.01, 0);
    s.add(spot);

    // Tor: Pfosten, Latte, Netz
    const postM = this.mat('#F8FAFC');
    for (const x of [-GOAL_W / 2, GOAL_W / 2]) {
      const p = new Mesh(this.geo(new BoxGeometry(0.14, GOAL_H, 0.14)), postM);
      p.position.set(x, GOAL_H / 2, GOAL_Z);
      s.add(p);
    }
    const bar = new Mesh(this.geo(new BoxGeometry(GOAL_W + 0.14, 0.14, 0.14)), postM);
    bar.position.set(0, GOAL_H, GOAL_Z);
    s.add(bar);
    const tex = this.track(netTexture());
    const netMat = (rx: number, ry: number) => {
      const t = tex.clone();
      t.repeat.set(rx, ry);
      t.needsUpdate = true;
      this.track(t);
      return this.track(new MeshBasicMaterial({ map: t, transparent: true, opacity: 0.55, side: DoubleSide }));
    };
    const back = new Mesh(this.geo(new PlaneGeometry(GOAL_W, GOAL_H)), netMat(18, 6));
    back.position.set(0, GOAL_H / 2, GOAL_Z - 1.8);
    s.add(back);
    const top = new Mesh(this.geo(new PlaneGeometry(GOAL_W, 1.8)), netMat(18, 5));
    top.rotation.x = Math.PI / 2;
    top.position.set(0, GOAL_H, GOAL_Z - 0.9);
    s.add(top);
    for (const x of [-GOAL_W / 2, GOAL_W / 2]) {
      const side = new Mesh(this.geo(new PlaneGeometry(1.8, GOAL_H)), netMat(5, 6));
      side.rotation.y = Math.PI / 2;
      side.position.set(x, GOAL_H / 2, GOAL_Z - 0.9);
      s.add(side);
    }

    // Tribüne
    const wall = new Mesh(this.geo(new BoxGeometry(60, 9, 1)), this.mat('#101A33'));
    wall.position.set(0, 4.5, GOAL_Z - 11);
    s.add(wall);
    const fan = this.geo(new BoxGeometry(0.7, 0.7, 0.4));
    const palette = ['#EF4444', '#F59E0B', '#38BDF8', '#A78BFA', '#F8FAFC', '#34D399'].map((c) => this.mat(c));
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 38; c++) {
        const f = new Mesh(fan, palette[(r * 7 + c * 13) % palette.length]);
        f.position.set(-28 + c * 1.5, 1.2 + r * 1.7, GOAL_Z - 10.4 + r * 0.3);
        s.add(f);
      }
    }

    // Ball
    this.ball = new Mesh(this.geo(new SphereGeometry(0.24, 20, 14)), this.mat('#FFFFFF'));
    s.add(this.ball);
    const patch = this.mat('#111827');
    const pg = this.geo(new SphereGeometry(0.06, 8, 6));
    for (const [x, y, z] of [[0.2, 0.1, 0.08], [-0.15, 0.15, 0.12], [0.05, -0.2, 0.1], [-0.18, -0.08, -0.14]]) {
      const d = new Mesh(pg, patch);
      d.position.set(x, y, z);
      this.ball.add(d);
    }

    // Torwart
    const jersey = this.mat('#FACC15');
    const skin = this.mat('#F6CFA8');
    const dark = this.mat('#1F2937');
    const glove = this.mat('#22D3EE');
    const body = new Mesh(this.geo(new BoxGeometry(0.75, 0.95, 0.32)), jersey);
    body.position.y = 1.15;
    const head = new Mesh(this.geo(new SphereGeometry(0.21, 14, 10)), skin);
    head.position.y = 1.85;
    const legGeo = this.geo(new BoxGeometry(0.28, 0.75, 0.28));
    for (const x of [-0.18, 0.18]) {
      const l = new Mesh(legGeo, dark);
      l.position.set(x, 0.4, 0);
      this.keeper.add(l);
    }
    const armGeo = this.geo(new BoxGeometry(0.2, 0.75, 0.2));
    const gloveGeo = this.geo(new BoxGeometry(0.26, 0.26, 0.26));
    for (const [g, side] of [[this.armL, -1], [this.armR, 1]] as const) {
      const a = new Mesh(armGeo, jersey);
      a.position.set(0, -0.37, 0);
      const gl = new Mesh(gloveGeo, glove);
      gl.position.set(0, -0.8, 0);
      g.add(a, gl);
      g.position.set(side * 0.5, 1.55, 0);
      this.keeper.add(g);
    }
    this.keeper.add(body, head);
    this.keeper.position.set(0, 0, GOAL_Z + 0.2);
    this.keeper.scale.setScalar(1.35);
    s.add(this.keeper);
    s.add(this.zoneGroup);
    this.resetBall();
  }

  private resetBall(): void {
    this.ball.position.set(0, 0.24, 0);
    this.ball.rotation.set(0, 0, 0);
  }

  /** Neue Frage: Antwort-Felder in der gewünschten Zahl, Ball und Torwart zurück an den Start */
  reset(n: number): void {
    for (const m of this.zoneMeshes) this.zoneGroup.remove(m);
    this.zoneMeshes = [];
    for (let i = 0; i < n; i++) {
      const tex = this.track(letterTexture(LETTERS[i], CHOICE_COLORS[i]));
      const mat = this.track(new MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.62 }));
      const m = new Mesh(this.geo(new PlaneGeometry(n === 4 ? 2.6 : 2.4, n === 4 ? 1.1 : 1.3)), mat);
      const p = zoneWorld(i, n);
      m.position.set(p.x, p.y, GOAL_Z + 0.03);
      m.userData.idx = i;
      this.zoneGroup.add(m);
      this.zoneMeshes.push(m);
    }
    this.anim = null;
    this.resetBall();
    this.keeper.position.set(0, 0, GOAL_Z + 0.2);
    this.keeper.rotation.set(0, 0, 0);
    this.armL.rotation.z = 0.5;
    this.armR.rotation.z = -0.5;
  }

  /** Welches Feld liegt unter dem Punkt (nx, ny ∈ 0…1 der Bildfläche)? −1 = keins */
  pick(nx: number, ny: number): number {
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(new Vector2(nx * 2 - 1, -(ny * 2 - 1)), this.camera);
    const hit = this.raycaster.intersectObjects(this.zoneMeshes, false)[0];
    return hit ? (hit.object.userData.idx as number) : -1;
  }

  /** Schuss in Feld `idx`; `goal`: trifft (sonst hält der Torwart); `done` wird am Ende der Animation einmal aufgerufen */
  shoot(idx: number, n: number, goal: boolean, keeper: number, done: () => void): void {
    this.anim = { t: 0, idx, goal, keeper, n, done, finished: false };
  }

  hit(): void {
    this.shake = 1;
  }

  update(dt: number): void {
    this.clock += dt;
    const a = this.anim;
    if (a) {
      a.t += dt;
      const target = zoneWorld(a.idx, a.n);
      const u = Math.min(1, a.t / SHOT_S);
      const ease = 1 - (1 - u) * (1 - u);
      if (u < 1 || a.goal) {
        let z = ease * GOAL_Z;
        let y = 0.24 + (target.y - 0.24) * ease + Math.sin(Math.PI * u) * 0.9;
        if (u >= 1) {
          const v = Math.min(1, (a.t - SHOT_S) / 0.35);
          z = GOAL_Z - v * 1.5;
          y = target.y - v * (target.y - 0.4);
        }
        this.ball.position.set(target.x * ease, y, z);
      } else {
        // gehalten: Ball prallt ab und rollt aus
        const v = Math.min(1, (a.t - SHOT_S) / 0.6);
        this.ball.position.set(target.x * (1 - v * 0.2), Math.max(0.24, target.y * (1 - v) + Math.sin(Math.PI * v) * 0.4), GOAL_Z + v * 1.4);
      }
      this.ball.rotation.x -= dt * 14;
      this.ball.rotation.z += dt * 5;
      // Torwart springt
      const kt = Math.min(1, Math.max(0, (a.t - 0.12) / 0.55));
      const ke = kt * kt * (3 - 2 * kt);
      const k = zoneWorld(a.keeper, a.n);
      const dir = Math.sign(k.x) || 1;
      this.keeper.position.x = k.x * 0.75 * ke;
      this.keeper.position.y = Math.max(0, (k.y - 0.9) * 0.6) * ke;
      this.keeper.rotation.z = -dir * 1.15 * ke;
      this.armL.rotation.z = 0.5 + 2.2 * ke * (dir > 0 ? 0.6 : 1);
      this.armR.rotation.z = -0.5 - 2.2 * ke * (dir > 0 ? 1 : 0.6);
      if (a.t >= SHOT_S && !a.finished) {
        const m = this.zoneMeshes[a.idx];
        if (m) (m.material as MeshBasicMaterial).color.set(a.goal ? '#22C55E' : '#EF4444');
        if (a.goal) this.shake = 0.6;
      }
      if (a.t >= TOTAL_S && !a.finished) {
        a.finished = true;
        a.done();
      }
    } else {
      // Torwart wippt leicht
      this.keeper.position.x = Math.sin(this.clock * 1.6) * 0.5;
    }
    this.shake = Math.max(0, this.shake - dt * 2.5);
    this.camera.position.x = (Math.random() - 0.5) * this.shake * 0.25;
    this.camera.position.y = 2.0 + (Math.random() - 0.5) * this.shake * 0.2;
    this.render();
  }
}
