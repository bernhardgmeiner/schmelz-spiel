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

  baueBoden(szene, physik);
  const eingang = new THREE.Group();
  eingang.position.copy(EINGANG);
  eingang.rotation.y = FASSADEN_WINKEL;
  szene.add(eingang);
  eingang.updateMatrixWorld(true);
  const bauer = new Bauer(eingang, physik);

  baueVorplatz(bauer);
  baueAula(bauer);
  baueUmgebung(bauer);

  const lokal = (x: number, z: number, y = 0) => eingang.localToWorld(new THREE.Vector3(x, y, z));
  const stationsplaetze = new Map<string, THREE.Vector3>([
    ['vorplatz-1', lokal(-6, -7)],
    ['vorplatz-2', lokal(7, -10)],
    ['vorplatz-3', lokal(-13, -13)],
    ['aula-1', lokal(-6, 6)],
    ['aula-2', lokal(6.5, 6.5)],
    ['aula-3', lokal(0, 12.6)],
    ['aula-4', lokal(8, 2.2)],
    ['aula-5', lokal(-8.3, 11.5)],
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

function baueBoden(szene: THREE.Scene, physik: RAPIER.World) {
  const wiese = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshLambertMaterial({ color: 0xa9bf86 }),
  );
  wiese.rotation.x = -Math.PI / 2;
  wiese.position.y = -0.02;
  wiese.receiveShadow = true;
  szene.add(wiese);
  physik.createCollider(RAPIER.ColliderDesc.cuboid(300, 1, 300).setTranslation(0, -1, 0));
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
  b.box(0, 0, -9, 70, 0.02, 18, 0xcfcac0, flach); // Vorplatz
  b.box(0, 0, -19, 160, 0.03, 4, 0xbdb8ae, flach); // Gehsteig
  b.box(0, 0, -25, 160, 0.01, 8, 0x6d7075, flach); // Fahrbahn
  for (let x = -76; x <= 76; x += 6) b.box(x, 0.012, -25, 3, 0.005, 0.18, 0xf2f2f2, flach); // Mittellinie
  b.box(0, 0, -31, 160, 0.03, 4, 0xbdb8ae, flach); // Gehsteig gegenüber
  // Gehsteigkanten
  b.box(0, 0, -21.05, 160, 0.12, 0.15, 0xa7a29a, { kollision: false });
  b.box(0, 0, -28.95, 160, 0.12, 0.15, 0xa7a29a, { kollision: false });

  // Stufe und Vordach am Eingang
  b.box(0, 0, -1.2, 9, 0.12, 2.4, 0xb9b4ab, { kollision: false });
  b.box(0, TUER_HOEHE + 0.2, -1.4, 8, 0.25, 2.8, 0x8a9399, { kollision: false });
  // Türrahmen außen
  b.box(-TUER_BREITE / 2 - 0.1, 0, -0.05, 0.2, TUER_HOEHE + 0.1, 0.2, 0x4a5157, { kollision: false });
  b.box(TUER_BREITE / 2 + 0.1, 0, -0.05, 0.2, TUER_HOEHE + 0.1, 0.2, 0x4a5157, { kollision: false });
  b.box(0, TUER_HOEHE, -0.05, TUER_BREITE + 0.4, 0.15, 0.2, 0x4a5157, { kollision: false });
  // offene Glastürflügel
  const glas = b.mat(0x9cc3d8, { transparent: true, opacity: 0.35 });
  b.box(-TUER_BREITE / 2 + 0.05, 0, 0.75, 0.06, 2.4, 1.4, glas, { kollision: false, schatten: false });
  b.box(TUER_BREITE / 2 - 0.05, 0, 0.75, 0.06, 2.4, 1.4, glas, { kollision: false, schatten: false });

  // Schild über dem Eingang
  const schild = textTafel(['GRG 15', 'Auf der Schmelz'], 6, 1.4);
  b.add(schild, 0, TUER_HOEHE + 1.35, -0.12);
  schild.rotation.y = Math.PI;

  // Fahrradständer, Bänke, Bäume, Laternen
  for (let i = 0; i < 6; i++) b.box(10 + i * 0.9, 0, -4, 0.08, 0.8, 0.9, 0x5a6168);
  b.box(-9, 0, -4, 2.2, 0.45, 0.6, 0x8b6a4a);
  b.box(-14, 0, -4, 2.2, 0.45, 0.6, 0x8b6a4a);
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

// ---------- Aula (Platzhalter) ----------

function baueAula(b: Bauer) {
  // Lage: hinter dem Haupteingang, 20 m breit, 14 m tief, 5 m hoch.
  // Echte Maße kommen aus dem Fluchtwegplan (Asset-Plan A1/A2).
  const B = 20, T = 14, H = 5, D = 0.3, z0 = 0.05;
  const innen = { innen: true };
  const wand = 0xf1ede4;
  // Boden und Decke
  b.box(0, 0, z0 + T / 2, B, 0.04, T, 0xcdc6b8, { ...innen, kollision: false });
  b.box(0, H, z0 + T / 2, B, 0.2, T, 0xf6f4ef, innen);
  // Wand vorne mit Türöffnung
  const seite = (B - TUER_BREITE) / 2;
  b.box(-(TUER_BREITE / 2 + seite / 2), 0, z0 + D / 2, seite, H, D, wand, innen);
  b.box(TUER_BREITE / 2 + seite / 2, 0, z0 + D / 2, seite, H, D, wand, innen);
  b.box(0, TUER_HOEHE, z0 + D / 2, TUER_BREITE, H - TUER_HOEHE, D, wand, innen);
  // Seiten und hinten
  b.box(-B / 2 - D / 2, 0, z0 + T / 2, D, H, T + D, wand, innen);
  b.box(B / 2 + D / 2, 0, z0 + T / 2, D, H, T + D, wand, innen);
  b.box(0, 0, z0 + T + D / 2, B + 2 * D, H, D, wand, innen);
  // Sockelleiste
  b.box(0, 0, z0 + T - 0.02, B, 0.12, 0.04, 0x8d8a83, { ...innen, kollision: false });

  // Deckenleuchten
  const licht = b.mat(0xffffff, { emissive: 0xfff6e0, emissiveIntensity: 0.9 });
  for (const lx of [-6, 0, 6]) for (const lz of [3.5, 7.5, 11.5]) {
    b.box(lx, H - 0.06, lz, 2.4, 0.06, 0.6, licht, { ...innen, kollision: false });
  }
  // Säulen
  for (const sx of [-4.5, 4.5]) for (const sz of [5, 10]) b.box(sx, 0, sz, 0.6, H, 0.6, 0xe4dfd4, innen);

  // Portierloge links vom Eingang
  b.box(-7.2, 0, 2.6, 3.6, 1.1, 0.8, 0x8f7a62, innen);
  b.box(-7.2, 1.1, 2.6, 3.7, 0.06, 0.95, 0xb9a487, { ...innen, kollision: false });
  // Bänke
  b.box(0, 0, 7.5, 3, 0.45, 0.6, 0x8b6a4a, innen);
  b.box(-8.8, 0, 7, 0.6, 0.45, 3, 0x8b6a4a, innen);
  // Pflanzen
  for (const [px, pz] of [[-9.3, 0.9], [9.3, 0.9], [9.3, 13.2]]) {
    b.box(px, 0, pz, 0.6, 0.5, 0.6, 0x9a6a4f, innen);
    const k = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), b.mat(0x5f8f4a, { flatShading: true }));
    b.add(k, px, 1.05, pz);
  }
  // Infobildschirm und Schaukasten
  const info = textTafel(['Willkommen · Welcome', 'Aula · GRG 15'], 3.2, 1.8, '#20343f');
  b.add(info, 3, 2.6, z0 + T - 0.02);
  info.rotation.y = Math.PI;
  b.box(9.95, 0.9, 9, 0.2, 1.6, 3.2, 0x6b4f3a, innen);
  const vitrine = textTafel(['Schaukasten', '(Fotos folgen)'], 3, 1.4, '#e9e3d6', '#55493b');
  b.add(vitrine, 9.83, 1.7, 9);
  vitrine.rotation.y = -Math.PI / 2;
  // Geschlossene Türen zum Gang (kommen in der nächsten Ausbaustufe)
  for (const tx of [-6, 7]) {
    b.box(tx, 0, z0 + T - 0.06, 2.2, 2.6, 0.1, 0x6f7d86, { ...innen, kollision: false });
    const s = textTafel(['Gang · Corridor', 'bald offen · coming soon'], 1.8, 0.5, '#2f4552');
    b.add(s, tx, 2.95, z0 + T - 0.12);
    s.rotation.y = Math.PI;
  }
  // Warmes Raumlicht
  const p = new THREE.PointLight(0xfff1dc, 6, 22, 1.2);
  b.add(p, 0, H - 0.8, 7);
}
