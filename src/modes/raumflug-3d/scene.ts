import { BufferAttribute, BufferGeometry, ConeGeometry, Group, IcosahedronGeometry, Mesh, MeshBasicMaterial, MeshLambertMaterial, PlaneGeometry, Points, PointsMaterial, SphereGeometry, TorusGeometry, BoxGeometry } from 'three';
import { Base3D, signTexture } from '@/ui/game3d/webgl';
import { CHOICE_COLORS, LETTERS } from '@/ui/game/colors';
import { nearest } from '@/engine/spaceRun';
import type { Flight } from '@/engine/spaceRun';

/** Umrechnung Spiel-Koordinaten (−1…1) → Meter */
export const WX = 4.2;
export const WY = 2.6;
const STARS = 520;

/** 3D-Szene des Raumflugs: Sternenhimmel, Schiff, Asteroiden, Antwort-Ringe */
export class SpaceScene extends Base3D {
  private ship = new Group();
  private glow: Mesh;
  private stars: Points;
  private rocks: Mesh[] = [];
  private gate = new Group();
  private rings: Mesh[] = [];
  private scroll = 0;
  private shake = 0;
  private prevX = 0;
  private clock = 0;

  constructor(host: HTMLElement, w: number, h: number) {
    super(host, w, h, { fov: 62, bg: '#050816' });
    this.camera.position.set(0, 0.8, 7);

    // Sterne
    const pos = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 90;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = -Math.random() * 160 + 10;
    }
    const g = this.geo(new BufferGeometry());
    g.setAttribute('position', new BufferAttribute(pos, 3));
    this.stars = new Points(g, this.track(new PointsMaterial({ color: '#E2E8F0', size: 0.28 })));
    this.scene.add(this.stars);

    // Planet im Hintergrund
    const planet = new Mesh(this.geo(new SphereGeometry(16, 28, 20)), this.mat('#4338CA'));
    planet.position.set(-38, 14, -150);
    this.scene.add(planet);
    const ringP = new Mesh(this.geo(new TorusGeometry(24, 0.8, 6, 48)), this.mat('#A5B4FC'));
    ringP.position.copy(planet.position);
    ringP.rotation.x = 1.25;
    this.scene.add(ringP);

    // Schiff (Spitze zeigt nach −z)
    const body = new Mesh(this.geo(new ConeGeometry(0.34, 1.7, 10)), this.mat('#E2E8F0'));
    body.rotation.x = -Math.PI / 2;
    const wings = new Mesh(this.geo(new BoxGeometry(2.0, 0.07, 0.65)), this.mat('#818CF8'));
    wings.position.set(0, 0, 0.45);
    const fin = new Mesh(this.geo(new BoxGeometry(0.07, 0.5, 0.55)), this.mat('#F472B6'));
    fin.position.set(0, 0.28, 0.6);
    this.glow = new Mesh(this.geo(new SphereGeometry(0.22, 10, 8)), this.track(new MeshBasicMaterial({ color: '#FB923C' })));
    this.glow.position.set(0, 0, 0.95);
    this.ship.add(body, wings, fin, this.glow);
    this.scene.add(this.ship);
    this.scene.add(this.gate);
  }

  /** Neue Runde: Felsen und Ringe passend zum Flug aufbauen */
  setFlight(f: Flight, choices: string[]): void {
    for (const r of this.rocks) this.scene.remove(r);
    this.rocks = [];
    const rockGeo = this.geo(new IcosahedronGeometry(1, 0));
    for (const r of f.rocks) {
      const m = new Mesh(rockGeo, this.mat('#78716C')); // eigenes Material: ein getroffener Fels wird rot, die anderen nicht
      m.scale.set(r.r * WX, r.r * WY, (r.r * (WX + WY)) / 2);
      m.position.set(r.x * WX, r.y * WY, -r.d);
      this.scene.add(m);
      this.rocks.push(m);
    }
    this.gate.clear();
    this.rings = [];
    f.zones.forEach((z, i) => {
      const ring = new Mesh(this.geo(new TorusGeometry(1.15, 0.13, 10, 36)), this.track(new MeshBasicMaterial({ color: CHOICE_COLORS[i] })));
      ring.position.set(z.x * WX, z.y * WY, 0);
      const tex = this.track(signTexture(LETTERS[i], choices[i] ?? '', CHOICE_COLORS[i]));
      const sign = new Mesh(this.geo(new PlaneGeometry(1.7, 1.7)), this.track(new MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92 })));
      sign.position.set(z.x * WX, z.y * WY, 0.02);
      this.gate.add(ring, sign);
      this.rings.push(ring);
    });
  }

  hit(): void {
    this.shake = 1;
  }

  update(f: Flight, dt: number, boost: number): void {
    this.clock += dt;
    this.scroll += f.speed * dt;
    // Sterne ziehen vorbei
    const p = this.stars.geometry.getAttribute('position') as BufferAttribute;
    for (let i = 0; i < STARS; i++) {
      let z = p.getZ(i) + f.speed * dt * 1.4;
      if (z > 10) z -= 160;
      p.setZ(i, z);
    }
    p.needsUpdate = true;

    const sx = f.x * WX;
    const sy = f.y * WY;
    this.ship.position.set(sx, sy, 0);
    this.ship.rotation.z = -(sx - this.prevX) * 4 - f.x * 0.25;
    this.ship.rotation.x = f.y * 0.12;
    this.prevX = sx;
    this.glow.scale.setScalar(1 + Math.sin(this.clock * 30) * 0.18 + boost * 0.05);

    f.rocks.forEach((r, i) => {
      const m = this.rocks[i];
      if (!m) return;
      m.position.z = -r.d;
      m.visible = r.d > -10;
      m.rotation.x += dt * 0.6;
      m.rotation.y += dt * 0.4;
      (m.material as MeshLambertMaterial).color.set(r.hit ? '#EF4444' : '#78716C');
    });
    this.gate.position.z = -f.gate;
    this.gate.visible = f.resolved === null || f.gate > -10;
    const near = nearest(f);
    this.rings.forEach((ring, i) => {
      const s = i === near ? 1.18 + Math.sin(this.clock * 8) * 0.04 : 1;
      ring.scale.setScalar(s);
    });

    this.shake = Math.max(0, this.shake - dt * 3);
    this.camera.position.set(sx * 0.5 + (Math.random() - 0.5) * this.shake * 0.4, sy * 0.5 + 0.8 + (Math.random() - 0.5) * this.shake * 0.4, 7);
    this.camera.lookAt(sx * 0.3, sy * 0.3, -14);
    const fov = 62 + boost * 1.4;
    if (Math.abs(this.camera.fov - fov) > 0.05) {
      this.camera.fov += (fov - this.camera.fov) * Math.min(1, dt * 4);
      this.camera.updateProjectionMatrix();
    }
    this.render();
  }
}
