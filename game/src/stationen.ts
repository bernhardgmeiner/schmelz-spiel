// Verteilt die Aufgaben eines Pakets auf Stationsplätze und zeichnet die Stationen.

import * as THREE from 'three';
import { Aufgabe } from './aufgaben/daten';

const OFFEN = 0xf2a31b;
const GELOEST = 0x46b06a;

export interface Station {
  aufgabe: Aufgabe;
  platz: string;
  pos: THREE.Vector3;
  gruppe: THREE.Group;
  saeule: THREE.Mesh;
  symbol: THREE.Object3D;
}

export function verteile(aufgaben: Aufgabe[], plaetze: Map<string, THREE.Vector3>): { zuteilung: [Aufgabe, string][]; warnungen: string[] } {
  const frei = new Set(plaetze.keys());
  const zuteilung: [Aufgabe, string][] = [];
  const warnungen: string[] = [];
  const ohneOrt: Aufgabe[] = [];
  for (const a of aufgaben) {
    if (a.ort && frei.has(a.ort)) { frei.delete(a.ort); zuteilung.push([a, a.ort]); }
    else {
      if (a.ort && !plaetze.has(a.ort)) warnungen.push(`Aufgabe ${a.id}: Ort "${a.ort}" gibt es nicht, Platz wird automatisch gewählt.`);
      ohneOrt.push(a);
    }
  }
  for (const a of ohneOrt) {
    const p = frei.values().next().value;
    if (!p) { warnungen.push(`Aufgabe ${a.id}: kein freier Stationsplatz mehr.`); continue; }
    frei.delete(p);
    zuteilung.push([a, p]);
  }
  return { zuteilung, warnungen };
}

function etikett(text: string): THREE.Sprite {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d')!;
  g.font = '600 56px system-ui, sans-serif';
  const b = Math.min(500, g.measureText(text).width + 60);
  g.fillStyle = 'rgba(20,32,40,0.78)';
  g.beginPath(); g.roundRect((512 - b) / 2, 18, b, 92, 46); g.fill();
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 256, 66, 460);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true }));
  s.scale.set(2, 0.5, 1);
  return s;
}

function npc(farbe: number): THREE.Group {
  const mat = (c: number) => new THREE.MeshLambertMaterial({ color: c, flatShading: true });
  const g = new THREE.Group();
  const rumpf = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.32, 0.75, 7), mat(farbe));
  rumpf.position.y = 1.15;
  const beine = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.8, 0.2), mat(0x34363f));
  beine.position.y = 0.4;
  const kopf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.21, 0), mat(0xd9a982));
  kopf.position.y = 1.74;
  const haare = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), mat(0x8a8a8a));
  haare.scale.set(1, 0.55, 1); haare.position.set(0, 1.83, 0.03);
  g.add(rumpf, beine, kopf, haare);
  g.traverse((o) => { o.castShadow = true; });
  return g;
}

export function baueStationen(szene: THREE.Scene, zuteilung: [Aufgabe, string][], plaetze: Map<string, THREE.Vector3>): Station[] {
  return zuteilung.map(([aufgabe, platz]) => {
    const pos = plaetze.get(platz)!.clone();
    const gruppe = new THREE.Group();
    gruppe.position.copy(pos);
    const saeule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 2.6, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: OFFEN, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
    );
    saeule.position.y = 1.3;
    let symbol: THREE.Object3D;
    if (aufgabe.figur) {
      const f = npc(aufgabe.typ === 'dialog' ? 0x7a4f9a : 0x3d7a6a);
      gruppe.add(f);
      symbol = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), new THREE.MeshBasicMaterial({ color: OFFEN }));
      symbol.position.y = 2.35;
    } else {
      // Pult mit schwebendem Würfel
      const pult = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.45), new THREE.MeshLambertMaterial({ color: 0x40505b }));
      pult.position.y = 0.5; pult.castShadow = true;
      gruppe.add(pult);
      symbol = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), new THREE.MeshBasicMaterial({ color: OFFEN }));
      symbol.position.y = 1.6;
    }
    const schild = etikett(aufgabe.figur || aufgabe.fach || 'Station');
    schild.position.y = aufgabe.figur ? 2.75 : 2.15;
    gruppe.add(saeule, symbol, schild);
    szene.add(gruppe);
    return { aufgabe, platz, pos, gruppe, saeule, symbol };
  });
}

export function setzeStatus(s: Station, geloest: boolean) {
  const c = geloest ? GELOEST : OFFEN;
  (s.saeule.material as THREE.MeshBasicMaterial).color.setHex(c);
  (s.saeule.material as THREE.MeshBasicMaterial).opacity = geloest ? 0.12 : 0.28;
  ((s.symbol as THREE.Mesh).material as THREE.MeshBasicMaterial).color.setHex(c);
}

export function animiere(stationen: Station[], zeit: number) {
  for (const s of stationen) {
    s.symbol.rotation.y = zeit * 1.2;
    s.symbol.position.y += Math.sin(zeit * 2 + s.pos.x) * 0.002;
  }
}

export function naechste(stationen: Station[], pos: THREE.Vector3, max = 2.3): Station | null {
  let beste: Station | null = null;
  let d = max;
  for (const s of stationen) {
    const e = Math.hypot(s.pos.x - pos.x, s.pos.z - pos.z);
    if (e < d && Math.abs(s.pos.y - pos.y) < 2) { d = e; beste = s; }
  }
  return beste;
}
