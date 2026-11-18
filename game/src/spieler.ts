// Spielfigur mit Schulterblick-Kamera, Kollision über Rapier.

import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { Eingabe } from './eingabe';

const RADIUS = 0.35;
const HALBE_HOEHE = 0.55; // Zylinderteil der Kapsel
const GEHEN = 3.2;
const LAUFEN = 6.0;
const SCHWERKRAFT = -20;

export class Spieler {
  figur = new THREE.Group();
  private koerper: RAPIER.RigidBody;
  private form: RAPIER.Collider;
  private regler: RAPIER.KinematicCharacterController;
  private fallen = 0;
  private gierwinkel = 0; // Blickrichtung der Kamera
  private neigung = 0.32;
  private abstand = 5;
  private aktAbstand = 5;
  private beine: THREE.Mesh[] = [];
  private arme: THREE.Mesh[] = [];
  private schritt = 0;

  constructor(
    szene: THREE.Scene,
    private physik: RAPIER.World,
    private kamera: THREE.PerspectiveCamera,
    start: THREE.Vector3,
    blick: number,
  ) {
    this.koerper = physik.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(start.x, start.y + 1, start.z),
    );
    this.form = physik.createCollider(RAPIER.ColliderDesc.capsule(HALBE_HOEHE, RADIUS), this.koerper);
    this.regler = physik.createCharacterController(0.02);
    this.regler.enableAutostep(0.35, 0.25, true);
    this.regler.enableSnapToGround(0.4);
    this.regler.setMaxSlopeClimbAngle((50 * Math.PI) / 180);
    this.regler.setApplyImpulsesToDynamicBodies(false);
    this.gierwinkel = blick;
    this.baueFigur();
    this.figur.rotation.y = blick;
    this.figur.position.set(start.x, start.y, start.z);
    szene.add(this.figur);
  }

  private baueFigur() {
    const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
    const rumpf = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.7, 7), mat(0x2f6f9f));
    rumpf.position.y = 1.15;
    const kopf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(0xe9c19f));
    kopf.position.y = 1.72;
    const haare = new THREE.Mesh(new THREE.IcosahedronGeometry(0.21, 0), mat(0x4a3426));
    haare.scale.set(1, 0.6, 1);
    haare.position.set(0, 1.8, 0.03);
    const rucksack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 0.18), mat(0xd9653b));
    rucksack.position.set(0, 1.2, 0.3);
    for (const s of [-1, 1]) {
      const bein = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.8, 0.18), mat(0x2d2f3a));
      bein.geometry.translate(0, -0.4, 0);
      bein.position.set(0.12 * s, 0.8, 0);
      this.beine.push(bein);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.14), mat(0x2f6f9f));
      arm.geometry.translate(0, -0.3, 0);
      arm.position.set(0.36 * s, 1.45, 0);
      this.arme.push(arm);
    }
    this.figur.add(rumpf, kopf, haare, rucksack, ...this.beine, ...this.arme);
    this.figur.traverse((o) => { o.castShadow = true; });
  }

  get position(): THREE.Vector3 {
    const p = this.koerper.translation();
    return new THREE.Vector3(p.x, p.y - HALBE_HOEHE - RADIUS, p.z);
  }

  update(dt: number, e: Eingabe) {
    // Umsehen
    this.gierwinkel -= e.blickX;
    this.neigung = THREE.MathUtils.clamp(this.neigung + e.blickY, -0.35, 1.1);
    this.abstand = THREE.MathUtils.clamp(this.abstand + e.zoom, 2.5, 9);

    // Bewegung relativ zur Kamera
    const vor = new THREE.Vector3(-Math.sin(this.gierwinkel), 0, -Math.cos(this.gierwinkel));
    const rechts = new THREE.Vector3(-vor.z, 0, vor.x);
    const wunsch = new THREE.Vector3()
      .addScaledVector(vor, e.vor)
      .addScaledVector(rechts, e.seite);
    const staerke = Math.min(1, wunsch.length());
    if (staerke > 0.01) wunsch.normalize();
    const tempo = (e.laufen ? LAUFEN : GEHEN) * staerke;

    this.fallen = this.regler.computedGrounded() ? -1 : Math.max(this.fallen + SCHWERKRAFT * dt, -30);
    const bewegung = { x: wunsch.x * tempo * dt, y: this.fallen * dt, z: wunsch.z * tempo * dt };
    this.regler.computeColliderMovement(this.form, bewegung);
    const k = this.regler.computedMovement();
    const p = this.koerper.translation();
    this.koerper.setNextKinematicTranslation({ x: p.x + k.x, y: p.y + k.y, z: p.z + k.z });

    // Figur ausrichten und animieren
    const pos = this.position;
    this.figur.position.lerp(pos, 0.6);
    if (staerke > 0.01) {
      const ziel = Math.atan2(wunsch.x, wunsch.z) + Math.PI;
      let diff = ziel - this.figur.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.figur.rotation.y += diff * Math.min(1, dt * 12);
      this.schritt += dt * tempo * 2.4;
    } else {
      this.schritt *= 0.8;
    }
    const schwung = Math.sin(this.schritt) * 0.6 * Math.min(1, staerke * 1.5);
    this.beine[0].rotation.x = schwung; this.beine[1].rotation.x = -schwung;
    this.arme[0].rotation.x = -schwung; this.arme[1].rotation.x = schwung;

    this.kameraNachziehen(pos, dt);
  }

  private kameraNachziehen(pos: THREE.Vector3, dt: number) {
    const ziel = pos.clone().add(new THREE.Vector3(0, 1.6, 0));
    const richtung = new THREE.Vector3(
      Math.sin(this.gierwinkel) * Math.cos(this.neigung),
      Math.sin(this.neigung),
      Math.cos(this.gierwinkel) * Math.cos(this.neigung),
    );
    // Kamera rückt näher, wenn eine Wand im Weg ist
    let frei = this.abstand;
    const strahl = new RAPIER.Ray(ziel, richtung);
    const treffer = this.physik.castRay(strahl, this.abstand, true, undefined, undefined, this.form, this.koerper);
    if (treffer) frei = Math.max(0.6, treffer.timeOfImpact - 0.3);
    this.aktAbstand = frei < this.aktAbstand ? frei : THREE.MathUtils.lerp(this.aktAbstand, frei, Math.min(1, dt * 4));
    this.kamera.position.copy(ziel).addScaledVector(richtung, this.aktAbstand);
    this.kamera.lookAt(ziel);
    // Figur ausblenden, wenn die Kamera zu nah ist
    this.figur.visible = this.aktAbstand > 1.1;
  }
}

