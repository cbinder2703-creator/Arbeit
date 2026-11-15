import { BoxGeometry, Color, ConeGeometry, CylinderGeometry, Group, Mesh, MeshLambertMaterial, PlaneGeometry, SphereGeometry } from 'three';
import type { Fog } from 'three';
import { Base3D } from '@/ui/game3d/webgl';

const BW = 2.4; // Blockbreite
const BH = 0.6; // Blockhöhe
const COLORS = ['#38BDF8', '#F59E0B', '#A78BFA', '#34D399', '#F472B6'];
const SKY_LOW = new Color('#7DD3FC');
const SKY_HIGH = new Color('#1E1B4B');
export const GOLD_EVERY = 5;

interface Falling {
  mesh: Mesh;
  v: { x: number; y: number; z: number };
  spin: number;
  t: number;
  done: () => void;
}
interface Dropping {
  mesh: Mesh;
  t: number;
  target: number;
  done: () => void;
}

/** 3D-Szene des Turmbaus: Sockel, Turm aus Blöcken, Kamera kreist und steigt mit */
export class TowerScene extends Base3D {
  private blocks: Mesh[] = [];
  private dropping: Dropping | null = null;
  private falling: Falling | null = null;
  private wobble = 0;
  private angle = 0.6;
  private camY = 4;
  private lookY = 1;
  private clouds: Mesh[] = [];
  private flag = new Group();
  private sky = new Color(SKY_LOW);

  constructor(host: HTMLElement, w: number, h: number) {
    super(host, w, h, { fov: 52, bg: '#7DD3FC', fogNear: 25, fogFar: 70 });
    const s = this.scene;
    const ground = new Mesh(this.geo(new CylinderGeometry(16, 16, 0.4, 40)), this.mat('#4ADE80'));
    ground.position.y = -0.2 - 0.4;
    s.add(ground);
    const plate = new Mesh(this.geo(new BoxGeometry(BW + 1.6, 0.4, BW + 1.6)), this.mat('#94A3B8'));
    plate.position.y = -0.2;
    s.add(plate);
    // Bäume und Steine am Rand
    const trunk = this.mat('#6B4423');
    const leaf = this.mat('#15803D');
    const tg = this.geo(new CylinderGeometry(0.2, 0.25, 1.2, 6));
    const lg = this.geo(new ConeGeometry(1.1, 2.4, 8));
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + (i % 3) * 0.2;
      const r = 8 + (i % 4) * 1.6;
      const t = new Group();
      const a1 = new Mesh(tg, trunk);
      a1.position.y = 0.6;
      const b1 = new Mesh(lg, leaf);
      b1.position.y = 2.2;
      t.add(a1, b1);
      t.position.set(Math.cos(a) * r, -0.4, Math.sin(a) * r);
      s.add(t);
    }
    // Wolken
    const cloudM = this.mat('#FFFFFF');
    const cg = this.geo(new SphereGeometry(1, 10, 8));
    for (let i = 0; i < 12; i++) {
      const c = new Mesh(cg, cloudM);
      c.scale.set(2.2 + (i % 3), 0.8, 1.3);
      const a = i * 1.7;
      c.position.set(Math.cos(a) * (13 + (i % 4) * 3), 4 + i * 2.6, Math.sin(a) * (13 + (i % 4) * 3));
      s.add(c);
      this.clouds.push(c);
    }
    // Fahne
    const pole = new Mesh(this.geo(new CylinderGeometry(0.04, 0.04, 1.4, 6)), this.mat('#E2E8F0'));
    pole.position.y = 0.7;
    const cloth = new Mesh(this.geo(new PlaneGeometry(0.8, 0.5)), this.mat('#EF4444'));
    cloth.position.set(0.42, 1.15, 0);
    (cloth.material as MeshLambertMaterial).side = 2;
    this.flag.add(pole, cloth);
    s.add(this.flag);
    this.flag.position.set(0, 0, 0);
  }

  get height(): number {
    return this.blocks.length;
  }

  private blockMaterial(i: number): MeshLambertMaterial {
    const gold = (i + 1) % GOLD_EVERY === 0;
    return this.track(new MeshLambertMaterial(gold ? { color: '#FACC15', emissive: '#7A5C00' } : { color: COLORS[i % COLORS.length] }));
  }

  /** Ein neuer Block fällt von oben auf den Turm; `done` am Ende der Landung */
  addBlock(done: () => void): void {
    const i = this.blocks.length;
    const m = new Mesh(this.geo(new BoxGeometry(BW, BH, BW)), this.blockMaterial(i));
    m.rotation.y = ((i * 37) % 7 - 3) * 0.018;
    const target = BH / 2 + i * BH;
    m.position.set(((i * 53) % 5 - 2) * 0.05, target + 8, ((i * 29) % 5 - 2) * 0.05);
    this.scene.add(m);
    this.blocks.push(m);
    this.dropping = { mesh: m, t: 0, target, done };
  }

  /** Falsch: Der Turm wackelt, der oberste Block kippt herunter (bei leerem Turm wackelt nur der Sockel) */
  collapse(done: () => void): void {
    this.wobble = 1;
    const top = this.blocks.pop();
    if (!top) {
      setTimeout(done, 450);
      return;
    }
    const dir = Math.random() < 0.5 ? -1 : 1;
    this.falling = { mesh: top, v: { x: dir * 2.5, y: 2.5, z: (Math.random() - 0.5) * 2 }, spin: dir * 2.4, t: 0, done };
  }

  update(dt: number): void {
    const d = this.dropping;
    if (d) {
      d.t += dt;
      const u = Math.min(1, d.t / 0.7);
      d.mesh.position.y = d.target + (1 - u * u) * 8;
      if (u >= 1) {
        // kurzes Zusammenstauchen
        const k = Math.min(1, (d.t - 0.7) / 0.18);
        d.mesh.scale.y = 1 - Math.sin(Math.PI * k) * 0.16;
        if (k >= 1) {
          d.mesh.scale.y = 1;
          this.dropping = null;
          d.done();
        }
      }
    }
    const f = this.falling;
    if (f) {
      f.t += dt;
      f.v.y -= 18 * dt;
      f.mesh.position.x += f.v.x * dt;
      f.mesh.position.y += f.v.y * dt;
      f.mesh.position.z += f.v.z * dt;
      f.mesh.rotation.z += f.spin * dt;
      f.mesh.rotation.x += f.spin * 0.4 * dt;
      if (f.t > 1.25) {
        this.scene.remove(f.mesh);
        this.falling = null;
        f.done();
      }
    }
    // Wackeln: die Blöcke schwingen, nach oben stärker
    this.wobble = Math.max(0, this.wobble - dt * 1.4);
    this.blocks.forEach((b, i) => {
      if (b === this.dropping?.mesh) return;
      b.position.x = ((i * 53) % 5 - 2) * 0.05 + Math.sin(performance.now() / 55 + i) * this.wobble * 0.05 * (1 + i * 0.12);
    });

    // Kamera kreist und steigt mit dem Turm
    const h = this.blocks.length * BH;
    this.angle += dt * 0.28;
    const radius = 10.5 + h * 0.18;
    this.camY += (3.2 + h * 0.75 - this.camY) * Math.min(1, dt * 2.5);
    this.lookY += (0.6 + h * 0.62 - this.lookY) * Math.min(1, dt * 2.5);
    this.camera.position.set(Math.cos(this.angle) * radius, this.camY, Math.sin(this.angle) * radius);
    this.camera.lookAt(0, this.lookY, 0);
    this.flag.position.y = h + (this.dropping ? 0 : 0);
    this.flag.rotation.y = -this.angle + 1.2;
    this.clouds.forEach((c, i) => (c.position.x += Math.sin(this.angle + i) * dt * 0.2));
    // Himmel wird mit der Höhe dunkler
    this.sky.copy(SKY_LOW).lerp(SKY_HIGH, Math.min(1, h / 14));
    (this.scene.background as Color).copy(this.sky);
    (this.scene.fog as Fog).color.copy(this.sky);
    this.render();
  }
}
