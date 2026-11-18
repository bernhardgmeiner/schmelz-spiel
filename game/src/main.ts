import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { baueWelt } from './welt';
import { Spieler } from './spieler';
import { Eingabe } from './eingabe';
import { t, sprache, setzeSprache, beiSprachwechsel } from './i18n';
import { ladeEinstellungen, ladeAufgaben, ladeDialoge, aufgabenFuerPaket, Aufgabe, DialogSchritt } from './aufgaben/daten';
import { zeigeAufgabe } from './aufgaben/ansicht';
import { Fortschritt } from './fortschritt';
import { verteile, baueStationen, setzeStatus, animiere, naechste, Station } from './stationen';
import { erzeugeCode } from './code';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const paket = (new URLSearchParams(location.search).get('paket') || 'demo').trim().toLowerCase();

// ---------- Texte ----------
function texteSetzen() {
  document.querySelectorAll<HTMLElement>('[data-t]').forEach((e) => {
    const v = t()[e.dataset.t as keyof ReturnType<typeof t>];
    if (typeof v === 'string') e.textContent = v;
  });
  $('btn-sprache').textContent = t().sprache;
  $('btn-sprache-start').textContent = t().sprache;
  $('start-paket').textContent = `${t().paket}: ${paket === 'demo' ? t().demo : paket}`;
  $('start-steuerung-text').textContent = eingabe.touch ? t().steuerungTouch : t().steuerungPc;
  document.title = t().titel;
}
const wechsle = () => setzeSprache(sprache() === 'de' ? 'en' : 'de');
$('btn-sprache').onclick = wechsle;
$('btn-sprache-start').onclick = wechsle;

let toastTimer = 0;
function toast(text: string, ms = 2600) {
  const e = $('toast');
  e.textContent = text;
  e.classList.add('an');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => e.classList.remove('an'), ms);
}

// ---------- Grafik ----------
const leinwand = $<HTMLCanvasElement>('welt');
const renderer = new THREE.WebGLRenderer({ canvas: leinwand, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const szene = new THREE.Scene();
szene.background = new THREE.Color(0xcfe3ee);
szene.fog = new THREE.Fog(0xcfe3ee, 120, 380);
const kamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

szene.add(new THREE.HemisphereLight(0xeaf3ff, 0xb3a58c, 1.4));
const sonne = new THREE.DirectionalLight(0xfff4e2, 2.0);
sonne.castShadow = true;
sonne.shadow.mapSize.set(2048, 2048);
sonne.shadow.camera.left = -35; sonne.shadow.camera.right = 35;
sonne.shadow.camera.top = 35; sonne.shadow.camera.bottom = -35;
sonne.shadow.camera.far = 160;
sonne.shadow.bias = -0.0004;
sonne.shadow.normalBias = 0.03;
szene.add(sonne, sonne.target);
const SONNE_VERSATZ = new THREE.Vector3(-40, 60, -55);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  kamera.aspect = window.innerWidth / window.innerHeight;
  kamera.updateProjectionMatrix();
});

const eingabe = new Eingabe(leinwand);
eingabe.aktiv = false; // erst nach dem Startbildschirm
texteSetzen();
beiSprachwechsel(() => { texteSetzen(); aktualisiereHud(); });

// ---------- Laden ----------
let spieler: Spieler;
let physik: RAPIER.World;
let stationen: Station[] = [];
let fortschritt: Fortschritt;
let aufgaben: Aufgabe[] = [];
let dialoge = new Map<string, DialogSchritt[]>();

function balken(anteil: number) {
  ($('ladebalken').firstElementChild as HTMLElement).style.width = `${Math.round(anteil * 100)}%`;
}

async function laden() {
  await RAPIER.init();
  balken(0.1);
  physik = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const [welt, daten] = await Promise.all([
    baueWelt(szene, physik, (a) => balken(0.1 + a * 0.6)),
    (async () => {
      const e = await ladeEinstellungen();
      const [a, d] = await Promise.all([ladeAufgaben(e.aufgabenQuelle), ladeDialoge(e.dialogQuelle)]);
      return { ...a, dialoge: d };
    })().catch((err) => { console.error(err); return null; }),
  ]);
  balken(0.85);

  if (!daten) {
    $('start-meldung').textContent = t().fehlerLaden;
  } else {
    daten.warnungen.forEach((w) => console.warn('[Aufgaben]', w));
    aufgaben = aufgabenFuerPaket(daten.aufgaben, paket);
    dialoge = daten.dialoge;
  }
  const { zuteilung, warnungen } = verteile(aufgaben, welt.stationsplaetze);
  warnungen.forEach((w) => console.warn('[Stationen]', w));
  aufgaben = zuteilung.map(([a]) => a);
  fortschritt = new Fortschritt(paket, aufgaben);
  stationen = baueStationen(szene, zuteilung, welt.stationsplaetze);
  stationen.forEach((s) => setzeStatus(s, fortschritt.istGeloest(s.aufgabe.id)));

  spieler = new Spieler(szene, physik, kamera, welt.start.pos, welt.start.blick);
  physik.step();
  renderer.compile(szene, kamera);
  balken(1);
  if (daten) $('start-meldung').textContent = aufgaben.length ? '' : t().keineAufgaben;
  const start = $<HTMLButtonElement>('btn-start');
  start.disabled = false;
  start.focus();
  start.onclick = () => {
    $('start').hidden = true;
    $('hud').hidden = false;
    eingabe.aktiv = true;
    aktualisiereHud();
  };
}

// ---------- HUD ----------
function aktualisiereHud() {
  if (!fortschritt) return;
  $('hud-punkte').textContent = String(fortschritt.punkte);
  $('hud-stationen').textContent = `${fortschritt.anzahlGeloest}/${aufgaben.length}`;
  const leiste = $('hud-abzeichen');
  leiste.replaceChildren();
  for (const a of fortschritt.abzeichen()) {
    const s = document.createElement('span');
    s.textContent = a.symbol;
    s.title = a.name[sprache()];
    leiste.append(s);
  }
}

// ---------- Stationen öffnen ----------
let offen = false;
let nahe: Station | null = null;

async function oeffne(s: Station) {
  if (offen) return;
  offen = true;
  eingabe.aktiv = false;
  eingabe.loslassen();
  eingabe.zeigeAktion(false, '');
  const vorher = fortschritt.istGeloest(s.aufgabe.id);
  const erg = await zeigeAufgabe(s.aufgabe, dialoge, vorher);
  if (erg.geloest && !vorher) {
    const { punkte, neu } = fortschritt.loese(s.aufgabe, erg.versuche);
    setzeStatus(s, true);
    aktualisiereHud();
    let text = t().punkteErhalten(punkte);
    if (neu.length) text += ` · ${t().abzeichenNeu}: ${neu.map((a) => `${a.symbol} ${a.name[sprache()]}`).join(', ')}`;
    toast(text, 3500);
    if (fortschritt.anzahlGeloest === aufgaben.length) setTimeout(() => toast(t().alleGeloest, 4500), 3600);
  }
  offen = false;
  eingabe.aktiv = true;
}

eingabe.beiAktion = () => { if (nahe && !$('start').offsetParent) oeffne(nahe); };

// ---------- Abschluss, Hilfe ----------
function einfachesFenster(titel: string): { inhalt: HTMLElement; schliessen: () => void } {
  const hinter = document.createElement('div');
  hinter.className = 'fenster-hintergrund';
  hinter.innerHTML = `<div class="fenster" role="dialog" aria-modal="true"><div class="fenster-kopf"><div class="fenster-titel"></div><button class="zu">×</button></div><div class="fenster-inhalt"></div></div>`;
  (hinter.querySelector('.fenster-titel') as HTMLElement).textContent = titel;
  document.body.append(hinter);
  eingabe.aktiv = false;
  eingabe.loslassen();
  const schliessen = () => { hinter.remove(); eingabe.aktiv = true; document.removeEventListener('keydown', esc); };
  const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') schliessen(); };
  document.addEventListener('keydown', esc);
  (hinter.querySelector('.zu') as HTMLElement).onclick = schliessen;
  return { inhalt: hinter.querySelector('.fenster-inhalt') as HTMLElement, schliessen };
}

$('btn-abschluss').onclick = () => {
  const { inhalt } = einfachesFenster(t().abschlussTitel);
  const p = document.createElement('p');
  p.textContent = t().abschlussText;
  const lab = document.createElement('label');
  lab.textContent = t().kuerzel;
  const feld = document.createElement('input');
  feld.className = 'abschluss-feld';
  feld.maxLength = 40;
  feld.value = fortschritt.kuerzel;
  lab.append(feld);
  const zusammenfassung = document.createElement('p');
  const codeBox = document.createElement('div');
  codeBox.className = 'abschluss-code';
  const kopieren = document.createElement('button');
  kopieren.className = 'haupt';
  kopieren.textContent = t().kopieren;
  const abz = document.createElement('ul');
  abz.className = 'liste-abzeichen';

  const neu = () => {
    fortschritt.kuerzel = feld.value.trim();
    const loesungen = aufgaben
      .filter((a) => fortschritt.istGeloest(a.id))
      .map((a) => [a.id, fortschritt.geloest[a.id].punkte, fortschritt.geloest[a.id].versuche] as [string, number, number]);
    codeBox.textContent = erzeugeCode({
      paket,
      kuerzel: fortschritt.kuerzel,
      datum: new Date().toISOString().slice(0, 10),
      loesungen,
    });
    zusammenfassung.textContent = `${t().paket}: ${paket} · ${t().stationen}: ${fortschritt.anzahlGeloest}/${aufgaben.length} · ${t().punkte}: ${fortschritt.punkte}`;
  };
  feld.oninput = neu;
  neu();
  kopieren.onclick = async () => {
    try { await navigator.clipboard.writeText(codeBox.textContent ?? ''); kopieren.textContent = t().kopiert; }
    catch { const r = document.createRange(); r.selectNodeContents(codeBox); getSelection()?.removeAllRanges(); getSelection()?.addRange(r); }
  };
  const liste = fortschritt.abzeichen();
  const h = document.createElement('h3');
  h.textContent = t().abzeichen;
  if (!liste.length) { const li = document.createElement('li'); li.textContent = t().keineAbzeichen; abz.append(li); }
  for (const a of liste) {
    const li = document.createElement('li');
    const s = document.createElement('span'); s.textContent = a.symbol;
    li.append(s, a.name[sprache()]);
    abz.append(li);
  }
  const reset = document.createElement('button');
  reset.textContent = t().neustart;
  reset.style.marginTop = '1.2em';
  reset.onclick = () => {
    if (!confirm(t().neustartFrage)) return;
    fortschritt.zuruecksetzen();
    stationen.forEach((s) => setzeStatus(s, false));
    aktualisiereHud();
    neu();
  };
  inhalt.append(p, lab, zusammenfassung, codeBox, document.createElement('br'), kopieren, h, abz, reset);
};

$('btn-hilfe').onclick = () => {
  const { inhalt } = einfachesFenster(t().steuerungTitel);
  for (const text of [eingabe.touch ? t().steuerungTouch : t().steuerungPc, t().steuerungZiel]) {
    const p = document.createElement('p'); p.textContent = text; inhalt.append(p);
  }
};

// ---------- Schleife ----------
const uhr = new THREE.Clock();
let angehalten = false; // nur für Tests: Schleife anhalten
function schleife() {
  requestAnimationFrame(schleife);
  const dt = Math.min(uhr.getDelta(), 1 / 20);
  if (!angehalten) bild(dt);
}
function bild(dt: number) {
  if (!spieler) return;
  eingabe.lesen();
  spieler.update(dt, eingabe);
  physik.step();
  const pos = spieler.position;
  sonne.position.copy(pos).add(SONNE_VERSATZ);
  sonne.target.position.copy(pos);
  animiere(stationen, uhr.elapsedTime);

  const n = offen ? null : naechste(stationen, pos);
  if (n !== nahe) {
    nahe = n;
    eingabe.zeigeAktion(!!n, n ? `${t().oeffnen}${eingabe.touch ? '' : ' (E)'}` : '');
  }
  renderer.render(szene, kamera);
}

laden().catch((e) => {
  console.error(e);
  $('start-meldung').textContent = `Fehler beim Laden: ${e?.message ?? e}`;
});
schleife();

// für Tests in der Konsole
(window as unknown as { spiel: unknown }).spiel = { get spieler() { return spieler; }, get stationen() { return stationen; }, oeffne,
  // n Bilder mit 1/60 s simulieren (für Tests, wenn der Tab im Hintergrund ist)
  tick: (n: number) => { for (let i = 0; i < n; i++) bild(1 / 60); },
  // Übersichtsbild von einer beliebigen Kameraposition (für Tests)
  anhalten: (a: boolean) => { angehalten = a; },
  ueberblick: (x: number, y: number, z: number, zx: number, zy: number, zz: number) => {
    const k = kamera.clone();
    k.position.set(x, y, z);
    if (Math.abs(x - zx) < 1e-3 && Math.abs(z - zz) < 1e-3) k.up.set(0, 0, 1); // Draufsicht: Norden oben
    k.lookAt(zx, zy, zz); k.far = 1200; k.updateProjectionMatrix();
    const nebel = szene.fog;
    szene.fog = null;
    renderer.render(szene, k);
    szene.fog = nebel;
  } };
