// Baut die Spielwelt: Schulgebäude aus dem GLB, Boden, Vorplatz, Straße,
// Nachbarhäuser und (als Platzhalter bis Plan und Fotos da sind) die Aula.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';

export interface Welt {
  stationsplaetze: Map<string, THREE.Vector3>;
  start: { pos: THREE.Vector3; blick: number };
}

// Das Modell liegt mit dem Boden auf y = -1,1 m; wir heben es auf 0.
const HOEHE_KORREKTUR = 1.1;

// Haupteingang: Mitte der Türöffnung und Ausrichtung der Fassade (aus dem GLB vermessen)
const EINGANG = new THREE.Vector3(-2.70, 0, -33.055);
const FASSADEN_WINKEL = -0.1101; // Drehung um y: lokales x entlang der Fassade, lokales z ins Gebäude
const TUER_BREITE = 4.94;
const TUER_HOEHE = 4.35;
const BODEN = 0.3; // Fußbodenhöhe innen (drei Stufen über dem Vorplatz)

// Low-Poly-Farben pro Mesh (Index aus dem Mesh-Namen). null = Textur behalten.
const FARBEN: Record<number, number | null> = {
  0: 0xe4e1d9, // wand_normal
  1: 0xeeebe4, // Wände/Laibungen ohne Textur
  2: 0xe0b03c, // Turnsaal gelb
  3: null, // fenster_toilette
  4: null, // fenster_haupt
  5: 0xd3d6d2, // wand_muster
  6: null, // fenster_dazwischen
  7: 0xc5c9c7, // dach
  8: 0x8fb6d0, // glasdach
  9: 0xb3b9b9, // dach_rand
  10: 0xd6d6d2,
  12: null, // fenster_rand
  13: null, // wand_turnsaal_fenster
  14: null, // turnsaal_tuer
};

export async function baueWelt(
  szene: THREE.Scene,
  physik: RAPIER.World,
  laden: (anteil: number) => void,
): Promise<Welt> {
  const gltf = await new GLTFLoader().loadAsync(
    new URL('modell/grg15-gebaeude.glb', document.baseURI).href,
    (e) => e.total && laden(e.loaded / e.total),
  );
  gltf.scene.updateMatrixWorld(true);

  const gebaeude = new THREE.Group();
  gebaeude.name = 'gebaeude';
  const hebung = new THREE.Matrix4().makeTranslation(0, HOEHE_KORREKTUR, 0);
  const meshes: THREE.Mesh[] = [];
  gltf.scene.traverse((o) => { if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh); });

  for (const m of meshes) {
    const idx = parseInt(/mesh_(\d+)/.exec(m.name)?.[1] ?? '-1', 10);
    if (idx === 11) continue; // aufgemalte Eingangstür: weg, damit der Eingang offen ist
    const geo = (m.geometry as THREE.BufferGeometry).clone();
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(hebung, m.matrixWorld));
    entferneTuerDreiecke(geo);
    geo.computeVertexNormals();
    const alt = m.material as THREE.MeshStandardMaterial;
    const farbe = FARBEN[idx];
    const mat = new THREE.MeshLambertMaterial({
      color: farbe ?? 0xffffff,
      map: farbe === null ? alt.map : null,
      transparent: idx === 8,
      opacity: idx === 8 ? 0.75 : 1,
      side: idx === 8 ? THREE.DoubleSide : THREE.FrontSide,
    });
    if (mat.map) mat.map.anisotropy = 4;
    const neu = new THREE.Mesh(geo, mat);
    neu.castShadow = idx !== 8;
    neu.receiveShadow = true;
    gebaeude.add(neu);

    // Kollision: das Gebäude als Dreiecksnetz
    const pos = geo.getAttribute('position');
    const verts = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      verts[i * 3] = pos.getX(i); verts[i * 3 + 1] = pos.getY(i); verts[i * 3 + 2] = pos.getZ(i);
    }
    const index = geo.index
      ? new Uint32Array(geo.index.array)
      : Uint32Array.from({ length: pos.count }, (_, i) => i);
    if (index.length >= 3) physik.createCollider(RAPIER.ColliderDesc.trimesh(verts, index));
  }
  szene.add(gebaeude);

  const eingang = new THREE.Group();
  eingang.position.copy(EINGANG);
  eingang.rotation.y = FASSADEN_WINKEL;
  szene.add(eingang);
  eingang.updateMatrixWorld(true);
  baueBoden(szene, physik, eingang);
  const bauer = new Bauer(eingang, physik);

  baueVorplatz(bauer);
  baueForum(bauer);
  baueUmgebung(bauer);

  const lokal = (x: number, z: number, y = 0) => eingang.localToWorld(new THREE.Vector3(x, y, z));
  const stationsplaetze = new Map<string, THREE.Vector3>([
    ['vorplatz-1', lokal(-6, -7)],
    ['vorplatz-2', lokal(7, -10)],
    ['vorplatz-3', lokal(-13, -13)],
    ['aula-1', lokal(-4.6, 4.5, BODEN)],
    ['aula-2', lokal(-3, 21, GRUBE)],
    ['aula-3', lokal(4.2, 35.2, BODEN)],
    ['aula-4', lokal(4.6, 4.5, BODEN)],
    ['aula-5', lokal(2.5, 25.5, GRUBE)],
  ]);
  return {
    stationsplaetze,
    start: { pos: lokal(0, -14, 1), blick: FASSADEN_WINKEL + Math.PI },
  };
}

function entferneTuerDreiecke(geo: THREE.BufferGeometry) {
  // Die Türfläche ist im weißen Mesh doppelt vorhanden; Dreiecke, deren
  // Mittelpunkt in der Türöffnung liegt, fliegen raus.
  const pos = geo.getAttribute('position');
  const alt = geo.index ? Array.from(geo.index.array) : Array.from({ length: pos.count }, (_, i) => i);
  const neu: number[] = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < alt.length; i += 3) {
    v.set(0, 0, 0);
    for (let k = 0; k < 3; k++) v.add(new THREE.Vector3().fromBufferAttribute(pos, alt[i + k]));
    v.divideScalar(3);
    const inTuer = v.x > -5.3 && v.x < -0.1 && v.y > -0.1 && v.y < TUER_HOEHE + 0.05 && v.z > -33.6 && v.z < -32.5;
    if (!inTuer) neu.push(alt[i], alt[i + 1], alt[i + 2]);
  }
  geo.setIndex(neu);
}

// ---------- Hilfsmittel zum Bauen im Koordinatensystem des Eingangs ----------

class Bauer {
  private mats = new Map<string, THREE.MeshLambertMaterial>();
  private boxGeo = new THREE.BoxGeometry(1, 1, 1);
  constructor(public gruppe: THREE.Group, private physik: RAPIER.World) {}

  mat(farbe: number, extra: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
    const k = `${farbe}-${JSON.stringify(extra)}`;
    if (!this.mats.has(k)) this.mats.set(k, new THREE.MeshLambertMaterial({ color: farbe, ...extra }));
    return this.mats.get(k)!;
  }

  /** Quader mit Mittelpunkt unten-mittig bei (x, y, z) in Eingangs-Koordinaten. */
  box(x: number, y: number, z: number, b: number, h: number, t: number, farbe: number | THREE.Material,
    opt: { kollision?: boolean; schatten?: boolean; innen?: boolean; drehung?: number } = {}): THREE.Mesh {
    const mat = typeof farbe === 'number' ? this.mat(farbe) : farbe;
    const m = new THREE.Mesh(this.boxGeo, mat);
    m.scale.set(b, h, t);
    m.position.set(x, y + h / 2, z);
    if (opt.drehung) m.rotation.y = opt.drehung;
    m.castShadow = opt.schatten ?? !opt.innen;
    m.receiveShadow = !opt.innen;
    this.gruppe.add(m);
    if (opt.kollision ?? true) {
      m.updateMatrixWorld(true);
      const p = m.getWorldPosition(new THREE.Vector3());
      const q = m.getWorldQuaternion(new THREE.Quaternion());
      this.physik.createCollider(
        RAPIER.ColliderDesc.cuboid(b / 2, h / 2, t / 2).setTranslation(p.x, p.y, p.z).setRotation(q),
      );
    }
    return m;
  }

  /** Beliebiges Mesh in Eingangs-Koordinaten, ohne Kollision. */
  add(o: THREE.Object3D, x: number, y: number, z: number) {
    o.position.set(x, y, z);
    this.gruppe.add(o);
    return o;
  }

  kollisionZylinder(x: number, z: number, r: number, h: number) {
    const p = this.gruppe.localToWorld(new THREE.Vector3(x, h / 2, z));
    this.physik.createCollider(RAPIER.ColliderDesc.cylinder(h / 2, r).setTranslation(p.x, p.y, p.z));
  }
}

function textTafel(zeilen: string[], breite: number, hoehe: number, hinter = '#1f3a4d', vorne = '#ffffff'): THREE.Mesh {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = Math.round(1024 * (hoehe / breite));
  const g = c.getContext('2d')!;
  g.fillStyle = hinter; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = vorne; g.textAlign = 'center'; g.textBaseline = 'middle';
  const zh = c.height / (zeilen.length + 0.6);
  zeilen.forEach((z, i) => {
    let groesse = Math.round(zh * (i === 0 ? 0.62 : 0.42));
    const schrift = () => `${i === 0 ? 700 : 500} ${groesse}px system-ui, sans-serif`;
    g.font = schrift();
    while (g.measureText(z).width > c.width * 0.9 && groesse > 8) { groesse -= 2; g.font = schrift(); }
    g.fillText(z, c.width / 2, zh * (i + 0.8));
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(breite, hoehe), new THREE.MeshBasicMaterial({ map: tex }));
}

// ---------- Boden ----------

function baueBoden(szene: THREE.Scene, physik: RAPIER.World, eingang: THREE.Group) {
  // Wiese mit einem Loch dort, wo das Atrium abgesenkt ist
  const loch = [[ATRIUM.x0, ATRIUM.z0], [ATRIUM.x1, ATRIUM.z0], [ATRIUM.x1, ATRIUM.z1], [ATRIUM.x0, ATRIUM.z1]]
    .map(([x, z]) => eingang.localToWorld(new THREE.Vector3(x, 0, z)));
  const form = new THREE.Shape([new THREE.Vector2(-300, -300), new THREE.Vector2(300, -300), new THREE.Vector2(300, 300), new THREE.Vector2(-300, 300)]);
  form.holes.push(new THREE.Path(loch.map((p) => new THREE.Vector2(p.x, -p.z))));
  const geo = new THREE.ShapeGeometry(form);
  geo.rotateX(-Math.PI / 2); // (x, y) -> (x, 0, -y)
  const wiese = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0xa9bf86 }));
  wiese.position.y = -0.02;
  wiese.receiveShadow = true;
  szene.add(wiese);
  // Kollision: vier Platten rund um das Loch, im gedrehten Eingangs-System
  const q = eingang.getWorldQuaternion(new THREE.Quaternion());
  const W = 400;
  const { x0, x1, z0, z1 } = ATRIUM;
  for (const [cx, cz, bx, bz] of [
    [x0 - W / 2, 0, W, 2 * W], [x1 + W / 2, 0, W, 2 * W],
    [(x0 + x1) / 2, z0 - W / 2, x1 - x0, W], [(x0 + x1) / 2, z1 + W / 2, x1 - x0, W],
  ]) {
    const p = eingang.localToWorld(new THREE.Vector3(cx, -1, cz));
    physik.createCollider(RAPIER.ColliderDesc.cuboid(bx / 2, 1, bz / 2).setTranslation(p.x, p.y, p.z).setRotation(q));
  }
  // Unsichtbare Grenze, damit man nicht ins Leere läuft
  for (const [x, z, b, t] of [[0, -170, 340, 2], [0, 170, 340, 2], [-170, 0, 2, 340], [170, 0, 2, 340]]) {
    physik.createCollider(RAPIER.ColliderDesc.cuboid(b / 2, 10, t / 2).setTranslation(x, 10, z));
  }
}

// ---------- Vorplatz, Straße ----------

function baueVorplatz(b: Bauer) {
  // Platzhalter, bis Orthofoto und Fotos da sind: gepflasterter Vorplatz,
  // Gehsteig, Straße, gegenüberliegender Gehsteig.
  const flach = { kollision: false, schatten: false };
  b.box(0, 0, -9, 70, 0.02, 18, 0xbab6ae, flach); // Vorplatz (Pflaster)
  b.box(0, 0, -19, 160, 0.03, 4, 0xbdb8ae, flach); // Gehsteig
  b.box(0, 0, -25, 160, 0.01, 8, 0x6d7075, flach); // Fahrbahn
  for (let x = -76; x <= 76; x += 6) b.box(x, 0.012, -25, 3, 0.005, 0.18, 0xf2f2f2, flach); // Mittellinie
  b.box(0, 0, -31, 160, 0.03, 4, 0xbdb8ae, flach); // Gehsteig gegenüber
  // Gehsteigkanten
  b.box(0, 0, -21.05, 160, 0.12, 0.15, 0xa7a29a, { kollision: false });
  b.box(0, 0, -28.95, 160, 0.12, 0.15, 0xa7a29a, { kollision: false });

  baueEingang(b);

  // Fahrradbügel links vom Eingang (wie auf dem Foto), Bäume, Laternen
  for (let i = 0; i < 8; i++) {
    const x = -16 + i * 1.1;
    b.box(x, 0, -1.6, 0.05, 0.75, 0.05, 0xb8bcc0, { kollision: false });
    b.box(x, 0, -2.4, 0.05, 0.75, 0.05, 0xb8bcc0, { kollision: false });
    b.box(x, 0.72, -2.0, 0.05, 0.05, 0.85, 0xb8bcc0, { kollision: false });
  }
  for (const [x, z] of [[-20, -15], [-8, -15.5], [8, -15.5], [20, -15], [32, -15], [-32, -15]]) baum(b, x, z);
  for (const x of [-36, -12, 12, 36]) {
    b.box(x, 0, -21.6, 0.15, 5.5, 0.15, 0x3e4449);
    b.box(x, 5.5, -22.1, 0.3, 0.15, 1.1, 0x3e4449, { kollision: false });
  }
}

function baum(b: Bauer, x: number, z: number, s = 1) {
  const stamm = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.25 * s, 2.6 * s, 6), b.mat(0x7a5a3e));
  stamm.position.y = 1.3 * s;
  const krone = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1 * s, 0), b.mat(0x6f9a52, { flatShading: true }));
  krone.position.y = 3.9 * s;
  const g = new THREE.Group();
  g.add(stamm, krone);
  g.traverse((o) => { o.castShadow = true; });
  b.add(g, x, 0, z);
  b.kollisionZylinder(x, z, 0.3 * s, 3);
}

// ---------- Nachbarschaft ----------

function baueUmgebung(b: Bauer) {
  // Nachbarhäuser als einfache Blöcke, Platzhalter bis zum Baukörpermodell der Stadt Wien
  const farben = [0xe8dcc8, 0xd9d2c5, 0xefe6d6, 0xd6cbb8, 0xe2d6c0];
  let x = -78;
  let i = 0;
  while (x < 78) {
    const breite = 14 + ((i * 7) % 9);
    const hoehe = 15 + ((i * 5) % 8);
    b.box(x + breite / 2, 0, -40, breite - 0.4, hoehe, 16, farben[i % farben.length]);
    // Fensterbänder als dunkle Streifen
    for (let g = 1; g < hoehe / 3.2; g++) {
      b.box(x + breite / 2, g * 3.2 - 1.2, -31.95, breite - 2, 1.3, 0.05, 0x56626c, { kollision: false, schatten: false });
    }
    x += breite;
    i++;
  }
}


// ---------- Haupteingang (nach Bernhards Fotos) ----------
// Gläsernes Vordach an vier Zugstangen, drei Doppeltüren aus Glas und Alu,
// Stufen mit gelber Kante, Geländer, Hecken, Pflanztröge, Leitlinie.

const ALU = 0xc9cdd0;
const STAHL = 0x8d9399;

function baueEingang(b: Bauer) {
  const glas = b.mat(0xa9c9d6, { transparent: true, opacity: 0.32 });
  const ohne = { kollision: false };

  // Podest und zwei Stufen bis auf Bodenhöhe innen
  b.box(0, 0, -1.3, 7.2, BODEN, 2.6, 0xb3afa8);
  for (let k = 0; k < 2; k++) {
    const t = -2.6 - 0.35 * (k + 1) + 0.175;
    b.box(0, 0, t, 7.2, BODEN - 0.1 * (k + 1), 0.35, 0xb3afa8);
    b.box(0, BODEN - 0.1 * (k + 1) - 0.005, t - 0.15, 7.2, 0.012, 0.06, 0xe8c531, ohne); // gelbe Kante
  }
  b.box(0, BODEN - 0.005, -2.57, 7.2, 0.012, 0.06, 0xe8c531, ohne);
  // Geländer links und rechts
  for (const sx of [-1, 1]) {
    const x = sx * 3.75;
    for (const z of [-3.3, -0.4]) b.box(x, 0, z, 0.05, 1.0 + BODEN, 0.05, ALU, ohne);
    b.box(x, 1.0 + BODEN, -1.85, 0.06, 0.05, 2.95, ALU, ohne);
  }

  // Türanlage: drei Doppeltüren, Oberlicht, Paneel bis zur Öffnungsoberkante
  const B = TUER_BREITE, H = 2.75, OBER = 3.35;
  const feld = B / 3;
  for (let i = 0; i < 3; i++) {
    const xm = -B / 2 + feld * (i + 0.5);
    b.box(xm - feld / 2 + 0.04, BODEN, 0.1, 0.08, OBER - BODEN, 0.12, ALU, ohne); // Rahmen
    if (i !== 1) {
      // geschlossene Flügel aus Glas mit Kollision
      b.box(xm, BODEN, 0.1, feld - 0.1, H - BODEN, 0.05, glas, { kollision: true, schatten: false });
      b.box(xm, BODEN + 1.0, 0.04, 0.04, 0.3, 0.04, 0x6d7378, ohne); // Griff
    } else {
      // mittlere Tür steht offen (Flügel nach innen geklappt)
      for (const sx of [-1, 1]) b.box(xm + sx * (feld / 2 - 0.05), BODEN, 0.5, 0.05, H - BODEN, 0.8, glas, { kollision: false, schatten: false });
    }
  }
  b.box(B / 2 - 0.04, BODEN, 0.1, 0.08, OBER - BODEN, 0.12, ALU, ohne);
  b.box(0, H, 0.1, B, 0.1, 0.12, ALU, ohne); // Kämpfer
  b.box(0, H + 0.1, 0.1, B, OBER - H - 0.15, 0.04, glas, { kollision: false, schatten: false }); // Oberlicht
  b.box(0, OBER - 0.05, 0.1, B, 0.1, 0.12, ALU, ohne);
  b.box(0, OBER + 0.05, 0.12, B, TUER_HOEHE - OBER, 0.1, 0xd9dad5, ohne); // Fassadenpaneel darüber

  // Vordach: Glasplatte auf vier Trägern, an Zugstangen zur Fassade
  const dachY = 3.75;
  b.box(0, dachY + 0.22, -2.0, 9.6, 0.04, 3.9, b.mat(0xd6ecec, { transparent: true, opacity: 0.55 }), { kollision: false, schatten: true });
  b.box(0, dachY, -0.15, 9.2, 0.2, 0.2, STAHL, ohne); // Wandträger
  for (const x of [-4.2, -1.4, 1.4, 4.2]) {
    b.box(x, dachY, -2.0, 0.12, 0.22, 3.9, STAHL, ohne);
    const von = new THREE.Vector3(x, dachY + 0.2, -3.8);
    const bis = new THREE.Vector3(x * 0.85, 9.2, -0.05);
    const stange = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, von.distanceTo(bis), 6), b.mat(ALU));
    stange.position.copy(von).lerp(bis, 0.5);
    stange.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bis.clone().sub(von).normalize());
    b.gruppe.add(stange);
  }
  for (const x of [-2.8, 0, 2.8]) b.box(x, dachY - 0.05, -2.6, 0.5, 0.05, 0.12, b.mat(0xffffff, { emissive: 0xfff3d6, emissiveIntensity: 0.6 }), ohne);

  // Hecken links und rechts des Eingangs
  const hecke = b.mat(0x3f5f37, { flatShading: true });
  b.box(-6.4, 0, -1.0, 4.6, 1.3, 1.6, hecke);
  b.box(6.6, 0, -1.0, 5.0, 1.3, 1.6, hecke);
  // Pflanztröge mit Büschen
  for (const x of [-3.0, -1.0, 1.0, 3.0]) {
    b.box(x, 0, -7.2, 1.9, 0.55, 0.65, 0xc27a62);
    const busch = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), b.mat(0x6f8f4c, { flatShading: true }));
    busch.scale.set(1.4, 0.9, 0.8);
    b.add(busch, x + (x > 0 ? 0.3 : -0.3), 0.85, -7.2);
  }
  // Blindenleitlinie vom Gehsteig zur Treppe
  for (let z = -17; z < -3.4; z += 0.3) b.box(-4.6, 0.02, z, 0.3, 0.01, 0.12, 0xd8cf9a, { kollision: false, schatten: false });

  // kleines Schild neben der Tür
  const schild = textTafel(['GRG 15', 'Auf der Schmelz'], 1.1, 0.55, '#f4f4f1', '#1f3a5f');
  b.add(schild, 3.3, 2.0, -0.08);
  schild.rotation.y = Math.PI;
}

// ---------- Atrium (so heißt die Aula an der Schule), nach Bernhards Fotos ----------
// Vom Eingang kommt man auf der oberen Ebene an. In der Mitte liegt die
// abgesenkte blaue Fläche mit beigen Rauten, ringsum führen vier Sitzstufen
// hinunter. Zum Eingang hin: dunkle Vorhänge zwischen den Stützen, Durchgang
// mit orangen Stützen und Uhr, darüber eine verglaste Box mit Leinwand.
// Hinten: gläserner Lift zwischen zwei Treppen. Galerien mit weißen
// Brüstungen und dunklem Holzhandlauf, Oberlicht unter dem Glasdach.
// Maße sind geschätzt, bis der Fluchtwegplan da ist.

const WEISS = 0xf3f1ec;
const BLAU_SOCKEL = 0x4b76ad;
const BEIGE = 0xe6bb8c;
const BLAU_BODEN = 0x4f7cab;
const HOLZ = 0x5a3a26;
const GELB_TUER = 0xe8cf72;
const ORANGE = 0xc8743f;
const VORHANG = 0x1f2226;

/** Grundfläche des Atriums in Eingangs-Koordinaten (hier hat der Außenboden ein Loch). */
const ATRIUM = { x0: -12, x1: 10, z0: 9, z1: 37 };
const STUFE = 0.35;
const GRUBE = BODEN - 4 * STUFE; // Höhe der blauen Fläche

function baueForum(b: Bauer) {
  const innen = { innen: true };
  const deko = { innen: true, kollision: false };
  const z0 = 0.05;
  const D = 0.3;
  const licht = (s = 0.8) => b.mat(0xffffff, { emissive: 0xfff4dc, emissiveIntensity: s });

  // --- Eingangshalle: x -7..7, z 0..9, Decke 3,6 m ---
  const hx = 7, hz = ATRIUM.z0, hh = 3.6;
  b.box(0, 0, (z0 + hz) / 2, 2 * hx, BODEN, hz - z0, BEIGE, innen);
  rauten(b, BODEN, -hx + 1, hx - 1, 1.4, hz - 0.6, 2.4, 0x4a6fa3, 0.8);
  const seite = hx - TUER_BREITE / 2;
  for (const sx of [-1, 1]) {
    b.box(sx * (TUER_BREITE / 2 + seite / 2), BODEN, z0 + D / 2, seite, hh, D, WEISS, innen);
    b.box(sx * (TUER_BREITE / 2 + seite / 2), BODEN, z0 + D + 0.02, seite, 1.0, 0.04, BLAU_SOCKEL, deko);
    b.box(sx * (hx + D / 2), BODEN, (z0 + hz) / 2, D, hh, hz - z0, WEISS, innen);
    b.box(sx * (hx - 0.02), BODEN, (z0 + hz) / 2, 0.04, 1.0, hz - z0, BLAU_SOCKEL, deko);
    b.box(sx * (hx - 0.03), BODEN, 5.5, 0.06, 2.2, 1.15, 0x2f3438, deko);
    b.box(sx * (hx - 0.06), BODEN, 5.5, 0.06, 2.1, 1.0, GELB_TUER, deko);
  }
  b.box(0, BODEN + hh, (z0 + hz) / 2, 2 * hx + 0.6, 0.2, hz - z0, 0xeceae4, innen);
  for (const lx of [-3.5, 0, 3.5]) for (const lz of [2.5, 6.5]) b.box(lx, BODEN + hh - 0.04, lz, 1.2, 0.04, 0.3, licht(), deko);
  const info = textTafel(['Willkommen · Welcome', 'Atrium →'], 2.4, 1.0, '#1f3a5f');
  b.add(info, -4.6, BODEN + 1.9, z0 + D + 0.03);

  // --- Atrium ---
  const { x0: fx0, x1: fx1, z0: fz0, z1: fz1 } = ATRIUM;
  const fh = 10.6;
  const mx = (fx0 + fx1) / 2, mz = (fz0 + fz1) / 2;
  // Grubenboden (trägt alles; liegt unter Geländeniveau)
  b.box(mx, GRUBE - 0.3, mz, fx1 - fx0, 0.3, fz1 - fz0, BEIGE, innen);
  // blaue Fläche (achteckig) mit Rauten
  const bx0 = -7, bx1 = 5, bz0 = 13, bz1 = 29, fase = 2;
  const form = new THREE.Shape();
  form.moveTo(bx0 + fase, bz0); form.lineTo(bx1 - fase, bz0); form.lineTo(bx1, bz0 + fase);
  form.lineTo(bx1, bz1 - fase); form.lineTo(bx1 - fase, bz1); form.lineTo(bx0 + fase, bz1);
  form.lineTo(bx0, bz1 - fase); form.lineTo(bx0, bz0 + fase); form.closePath();
  const geo = new THREE.ShapeGeometry(form);
  geo.rotateX(Math.PI / 2); // (x, y) -> (x, 0, y)
  b.add(new THREE.Mesh(geo, b.mat(BLAU_BODEN, { side: THREE.DoubleSide })), 0, GRUBE + 0.003, 0);
  rauten(b, GRUBE, bx0 + 1.5, bx1 - 1.5, bz0 + 1.5, bz1 - 1.5, 3, 0xf0cf93, 1.0);

  // Sitzstufen auf allen vier Seiten, 4 Stufen à 35 cm; die oberste reicht bis zur Wand
  for (let k = 1; k <= 4; k++) {
    const oben = k === 4;
    const h = STUFE * k;
    const ax0 = oben ? fx0 : bx0 - k, ax1 = oben ? fx1 : bx1 + k; // äußere Kante
    const az0 = oben ? fz0 : bz0 - k, az1 = oben ? fz1 : bz1 + k;
    const ix0 = bx0 - (k - 1), ix1 = bx1 + (k - 1), iz0 = bz0 - (k - 1), iz1 = bz1 + (k - 1); // innere Kante
    b.box((ax0 + ax1) / 2, GRUBE, (az0 + iz0) / 2, ax1 - ax0, h, iz0 - az0, BEIGE, innen); // vorne
    b.box((ax0 + ax1) / 2, GRUBE, (iz1 + az1) / 2, ax1 - ax0, h, az1 - iz1, BEIGE, innen); // hinten
    b.box((ax0 + ix0) / 2, GRUBE, (iz0 + iz1) / 2, ix0 - ax0, h, iz1 - iz0, BEIGE, innen); // links
    b.box((ix1 + ax1) / 2, GRUBE, (iz0 + iz1) / 2, ax1 - ix1, h, iz1 - iz0, BEIGE, innen); // rechts
    if (!oben) {
      // blaue Polster auf den Stufen, Lüftungsgitter in den Setzstufen
      const y = GRUBE + h;
      for (let z = iz0 + 1.5; z < iz1 - 1; z += 4) {
        b.box(ix0 - 0.5, y, z, 0.35, 0.07, 1.5, 0x3e6493, deko);
        b.box(ix1 + 0.5, y, z, 0.35, 0.07, 1.5, 0x3e6493, deko);
        b.box(ix0 + 0.01, y - 0.25, z + 2, 0.02, 0.12, 1.2, 0x8a8f94, deko);
        b.box(ix1 - 0.01, y - 0.25, z + 2, 0.02, 0.12, 1.2, 0x8a8f94, deko);
      }
      for (let x = ix0 + 1.5; x < ix1 - 1; x += 4) {
        b.box(x, y, iz0 - 0.5, 1.5, 0.07, 0.35, 0x3e6493, deko);
        b.box(x, y, iz1 + 0.5, 1.5, 0.07, 0.35, 0x3e6493, deko);
        b.box(x + 2, y - 0.25, iz0 - 0.01, 1.2, 0.12, 0.02, 0x8a8f94, deko);
      }
    }
  }

  // Wände
  b.box(fx0 - D / 2, GRUBE, mz, D, fh - GRUBE, fz1 - fz0, WEISS, innen);
  b.box(fx1 + D / 2, GRUBE, mz, D, fh - GRUBE, fz1 - fz0, WEISS, innen);
  b.box(mx, GRUBE, fz1 + D / 2, fx1 - fx0 + 2 * D, fh - GRUBE, D, WEISS, innen);
  b.box((fx0 - hx) / 2, 0, fz0 - D / 2, -hx - fx0, fh, D, WEISS, innen);
  b.box((hx + fx1) / 2, 0, fz0 - D / 2, fx1 - hx, fh, D, WEISS, innen);
  b.box(0, BODEN + hh, fz0 - D / 2, 2 * hx, fh - BODEN - hh, D, WEISS, innen);
  for (const x of [fx0 + 0.02, fx1 - 0.02]) b.box(x, BODEN, mz, 0.04, 1.0, fz1 - fz0, BLAU_SOCKEL, deko);
  b.box(mx, BODEN, fz1 - 0.02, fx1 - fx0, 1.0, 0.04, BLAU_SOCKEL, deko);

  // Eingangsseite: Stützenreihe mit dunklen Vorhängen, Durchgang mit orangen Stützen und Uhr
  const vz = fz0 + 0.7;
  const stuetzeX = [fx0 + 0.25, -6.5, -2.4, 2.4, 6.5, fx1 - 0.25];
  for (const x of stuetzeX) {
    const orange = Math.abs(x) === 2.4;
    b.box(x, BODEN, vz, 0.45, 3.6, 0.45, orange ? ORANGE : WEISS, innen);
  }
  // Vorhänge sind offen: zusammengeschoben neben den Stützen, Schiene darüber
  for (let i = 0; i < stuetzeX.length - 1; i++) {
    const a = stuetzeX[i] + 0.25, e = stuetzeX[i + 1] - 0.25;
    if (a < 0 && e > 0) continue; // Mitte hat keinen Vorhang
    for (const [x, s] of [[a, 1], [e, -1]] as [number, number][]) {
      for (let f = 0; f < 3; f++) b.box(x + s * (0.1 + f * 0.11), BODEN, vz + (f % 2 ? 0.07 : -0.07), 0.13, 3.45, 0.16, VORHANG, deko);
    }
    b.box((a + e) / 2, BODEN + 3.5, vz, e - a, 0.05, 0.08, 0x8f969b, deko);
  }
  b.box(0, BODEN + 3.6, vz, fx1 - fx0, 0.5, 0.5, WEISS, innen); // Unterzug

  // Hinter der Stützenreihe: Gang mit Buffet, Glastüren und Pinnwänden (rechte Wand)
  const rw = fx1 - 0.04;
  b.box(rw, BODEN, 13, 0.06, 3.0, 3.2, 0x6f6a66, deko); // Buffet-Front
  for (let y = 0.2; y < 2.6; y += 0.18) b.box(rw - 0.02, BODEN + y, 13, 0.03, 0.05, 2.9, 0xd9d6cf, deko); // Rollladen
  const buffet = textTafel(['Buffet'], 1.6, 0.45, '#6f6a66', '#ffffff');
  b.add(buffet, rw - 0.05, BODEN + 2.75, 13);
  buffet.rotation.y = -Math.PI / 2;
  b.box(rw, BODEN, 17.5, 0.06, 2.6, 2.6, 0x9aa0a4, deko); // Glastür-Rahmen
  b.box(rw - 0.02, BODEN + 0.05, 17.5, 0.04, 2.45, 2.45, b.mat(0x9fbcc8, { transparent: true, opacity: 0.45 }), deko);
  b.box(rw - 0.03, BODEN + 1.0, 21.5, 0.04, 1.2, 2.4, 0xc8a46e, deko); // Pinnwand
  for (const [dz, dy, f] of [[-0.7, 0.3, 0xf4f1e6], [0.1, 0.5, 0xbfe0f2], [0.7, 0.2, 0xf7e27c]] as [number, number, number][]) {
    b.box(rw - 0.05, BODEN + 1.0 + dy, 21.5 + dz, 0.02, 0.6, 0.45, f, deko);
  }

  // Wuzzler auf der oberen Ebene links
  for (const z of [27, 31.5]) {
    b.box(-11, BODEN + 0.6, z, 0.75, 0.25, 1.4, 0x2f6b3a, innen);
    for (const [ex, ez] of [[-0.3, -0.6], [0.3, -0.6], [-0.3, 0.6], [0.3, 0.6]]) b.box(-11 + ex, BODEN, z + ez, 0.07, 0.6, 0.07, 0x333333, deko);
    for (let s = -0.5; s <= 0.5; s += 0.2) b.box(-11, BODEN + 0.78, z + s, 1.1, 0.025, 0.025, 0xb8bcc0, deko);
  }

  // Bunte Fische aus Pappmaché hängen unter der Decke
  const fischFarben = [0x2f4fa8, 0xe3622f, 0x3f8f5a, 0xd04a7a, 0x2a2f45, 0xf0c33c, 0x3fb0c9];
  const fischPos: [number, number, number][] = [[-4, 8.6, 20], [1, 9.0, 23], [-2.5, 7.8, 27], [3, 8.2, 30], [-6, 9.2, 26], [0, 7.4, 33], [2, 9.4, 18], [-1, 8.0, 31.5]];
  fischPos.forEach(([x, y, z], i) => {
    const fisch = new THREE.Group();
    const farbe = b.mat(fischFarben[i % fischFarben.length], { flatShading: true });
    const leib = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), farbe);
    leib.scale.set(1.3, 0.75, 0.45);
    const schwanz = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 4), farbe);
    schwanz.rotation.z = Math.PI / 2;
    schwanz.position.x = -0.8;
    const auge = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), b.mat(0xffffff));
    auge.position.set(0.4, 0.12, 0.2);
    const faden = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 10.6 - y, 3), b.mat(0xcccccc));
    faden.position.y = (10.6 - y) / 2;
    fisch.add(leib, schwanz, auge, faden);
    fisch.rotation.y = i * 1.3;
    b.add(fisch, x, y, z);
  });
  // Uhr über dem Durchgang
  const uhr = new THREE.Group();
  const ziffer = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.08), b.mat(0xf7f7f4));
  const rand = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.78, 0.06), b.mat(0x9aa0a4));
  const zeiger1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.02), b.mat(0x222222));
  zeiger1.position.set(0, 0.1, 0.05);
  const zeiger2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.035, 0.02), b.mat(0x222222));
  zeiger2.position.set(0.08, 0, 0.05);
  uhr.add(rand, ziffer, zeiger1, zeiger2);
  b.add(uhr, 0, BODEN + 3.15, vz + 0.3);

  // Galerien in 4,6 m und 8,0 m Höhe als Ring um den offenen Luftraum
  const gx0 = -9, gx1 = 7, gz0 = 11.5, gz1 = 34.6;
  for (const ebene of [4.6, 8.0]) {
    const dicke = 0.45, y = ebene - dicke;
    b.box(mx, y, (fz0 + gz0) / 2, fx1 - fx0, dicke, gz0 - fz0, WEISS, deko);
    b.box(mx, y, (gz1 + fz1) / 2, fx1 - fx0, dicke, fz1 - gz1, WEISS, deko);
    b.box((fx0 + gx0) / 2, y, (gz0 + gz1) / 2, gx0 - fx0, dicke, gz1 - gz0, WEISS, deko);
    b.box((gx1 + fx1) / 2, y, (gz0 + gz1) / 2, fx1 - gx1, dicke, gz1 - gz0, WEISS, deko);
    const bruestung = (x: number, z: number, lx: number, lz: number) => {
      b.box(x, ebene, z, lx, 1.0, lz, 0xf6f5f1, deko);
      b.box(x, ebene + 1.0, z, lx + 0.12, 0.08, lz + 0.12, HOLZ, deko);
    };
    bruestung((gx0 + gx1) / 2, gz0, gx1 - gx0, 0.15);
    bruestung((gx0 + gx1) / 2, gz1, gx1 - gx0, 0.15);
    bruestung(gx0, (gz0 + gz1) / 2, 0.15, gz1 - gz0);
    bruestung(gx1, (gz0 + gz1) / 2, 0.15, gz1 - gz0);
    for (const z of [15, 21, 27]) {
      b.box(fx0 + 0.05, ebene, z, 0.06, 2.1, 1.0, GELB_TUER, deko);
      b.box(fx1 - 0.05, ebene, z, 0.06, 2.1, 1.0, GELB_TUER, deko);
    }
    b.box(fx0 + 0.02, ebene, mz, 0.04, 0.9, fz1 - fz0, BLAU_SOCKEL, deko);
    b.box(fx1 - 0.02, ebene, mz, 0.04, 0.9, fz1 - fz0, BLAU_SOCKEL, deko);
    for (const z of [14, 20, 26, 32]) b.box(-1, ebene + 2.9, z, 1.0, 0.04, 0.3, licht(0.5), deko);
  }
  // Schilder auf der ersten Galerie über dem Eingang (gelbe Wand rechts)
  b.box(6.5, 4.6, fz0 + 0.03, 6.5, 2.4, 0.04, 0xe9c23f, deko);
  for (const [x, text] of [[4.8, 'direktion'], [8.2, 'administration']] as [number, string][]) {
    const s = textTafel([text], 2.4, 0.35, '#f4f2ea', '#2a3540');
    b.add(s, x, 6.7, fz0 + 0.06);
  }
  const werken = textTafel(['TEXTILES', 'WERKEN'], 1.6, 0.9, '#f3f1ec', '#2a3540');
  b.add(werken, 2.4, 5.9, fz0 + 0.06);

  // Verglaste Box über dem Durchgang, darunter die eingerollte Leinwand
  const gbz0 = gz0, gbz1 = gz0 + 2.2;
  b.box(0, 4.15, (gbz0 + gbz1) / 2, 7, 0.9, gbz1 - gbz0, 0xf6f5f1, deko); // Brüstungspaneel
  b.box(0, 5.05, (gbz0 + gbz1) / 2, 7, 2.4, gbz1 - gbz0, b.mat(0x9fbcc8, { transparent: true, opacity: 0.35 }), { innen: true, kollision: false, schatten: false });
  for (let x = -3.5; x <= 3.5; x += 1.0) b.box(x, 5.05, gbz1, 0.06, 2.4, 0.06, 0x9aa0a4, deko);
  b.box(0, 7.45, (gbz0 + gbz1) / 2, 7.1, 0.15, gbz1 - gbz0 + 0.1, WEISS, deko);
  b.box(0, 3.95, gbz1 - 0.3, 5.5, 0.14, 0.14, 0x8f969b, deko); // Leinwandkasten

  // Stützen der Galerien: weiß, zwei mit orangem Belag
  const stuetzen: [number, number, number][] = [[gx0, gz0, WEISS], [gx1, gz0, WEISS], [gx0, 23, ORANGE], [gx1, 23, WEISS], [gx0, gz1, WEISS], [gx1, gz1, ORANGE]];
  for (const [x, z, farbe] of stuetzen) b.box(x, GRUBE, z, 0.5, 8.0 - GRUBE, 0.5, farbe, innen);

  // Gläserner Lift hinten in der Mitte, auf der oberen Ebene
  const lx = -1, lz = 35.6, ebene0 = BODEN;
  const liftGlas = b.mat(0xb7d3dc, { transparent: true, opacity: 0.3 });
  b.box(lx, ebene0, lz, 2.4, 9.0, 2.4, liftGlas, { innen: true, schatten: false });
  for (const [ex, ez] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) b.box(lx + ex, ebene0, lz + ez, 0.08, 9.0, 0.08, 0x9ea5a8, deko);
  for (const y of [3.2, 6.6]) b.box(lx, ebene0 + y, lz, 2.45, 0.08, 2.45, 0x9ea5a8, deko);
  b.box(lx, ebene0, lz, 1.4, 2.3, 1.4, 0x8f979b, deko);

  // Zwei Treppen, unten außen, oben beim Lift (noch gesperrt)
  const stufen = 12, auftritt = 0.42;
  const steigung = (4.6 - ebene0) / stufen;
  const lauf = stufen * auftritt;
  for (const sx of [-1, 1]) {
    const start = lx + sx * 1.6;
    for (let i = 0; i < stufen; i++) {
      const x = start + sx * ((stufen - 1 - i) * auftritt + auftritt / 2);
      const top = ebene0 + (i + 1) * steigung;
      b.box(x, top - 0.18, 33.9, auftritt, 0.18, 1.6, WEISS, deko);
    }
    const winkel = Math.atan2(4.6 - ebene0, lauf);
    const wange = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(lauf, 4.6 - ebene0), 0.8, 0.1), b.mat(0xf6f5f1));
    wange.position.set(start + sx * lauf / 2, (ebene0 + 4.6) / 2 + 0.2, 33.05);
    wange.rotation.z = -sx * winkel;
    b.gruppe.add(wange);
    const handlauf = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(lauf, 4.6 - ebene0), 0.08, 0.14), b.mat(HOLZ));
    handlauf.position.copy(wange.position).add(new THREE.Vector3(0, 0.44, 0));
    handlauf.rotation.z = -sx * winkel;
    b.gruppe.add(handlauf);
    const fuss = start + sx * (lauf + 0.25);
    b.box(fuss, ebene0, 33.9, 0.1, 1.0, 1.8, 0xd0453a, { innen: true });
    const s = textTafel(['1. Stock', 'bald offen · coming soon'], 1.3, 0.45, '#b23a2f');
    b.add(s, fuss, ebene0 + 1.3, 32.95);
    s.rotation.y = Math.PI;
  }

  // Decke mit Oberlicht unter dem Glasdach
  const ox0 = -5, ox1 = 3, oz0 = 17, oz1 = 33;
  const decke = 0xeceae4;
  b.box(mx, fh, (fz0 + oz0) / 2, fx1 - fx0, 0.3, oz0 - fz0, decke, deko);
  b.box(mx, fh, (oz1 + fz1) / 2, fx1 - fx0, 0.3, fz1 - oz1, decke, deko);
  b.box((fx0 + ox0) / 2, fh, (oz0 + oz1) / 2, ox0 - fx0, 0.3, oz1 - oz0, decke, deko);
  b.box((ox1 + fx1) / 2, fh, (oz0 + oz1) / 2, fx1 - ox1, 0.3, oz1 - oz0, decke, deko);
  b.box((ox0 + ox1) / 2, fh + 0.9, (oz0 + oz1) / 2, ox1 - ox0, 0.05, oz1 - oz0, b.mat(0xeaf5ff, { emissive: 0xe4f1ff, emissiveIntensity: 1.0 }), deko);
  for (let x = ox0 + 2; x < ox1; x += 2) b.box(x, fh + 0.3, (oz0 + oz1) / 2, 0.08, 0.6, oz1 - oz0, 0xb9c0c4, deko);
  b.box(ox0, fh + 0.3, (oz0 + oz1) / 2, 0.1, 0.6, oz1 - oz0, WEISS, deko);
  b.box(ox1, fh + 0.3, (oz0 + oz1) / 2, 0.1, 0.6, oz1 - oz0, WEISS, deko);

  // Raumlicht
  const p1 = new THREE.PointLight(0xfff4e4, 5, 30, 1.2);
  b.add(p1, -1, 7, 20);
  const p2 = new THREE.PointLight(0xfff1dc, 3, 14, 1.2);
  b.add(p2, 0, BODEN + 3.0, 4.5);
}

/** Um 45° gedrehte Quadrate als Bodenmuster auf Höhe y. */
function rauten(b: Bauer, y: number, x0: number, x1: number, z0: number, z1: number, abstand: number, farbe: number, groesse: number) {
  let reihe = 0;
  for (let z = z0; z <= z1; z += abstand * 0.75, reihe++) {
    for (let x = x0 + (reihe % 2) * abstand / 2; x <= x1; x += abstand) {
      b.box(x, y + 0.002, z, groesse, 0.006, groesse, farbe, { kollision: false, innen: true, drehung: Math.PI / 4 });
    }
  }
}
