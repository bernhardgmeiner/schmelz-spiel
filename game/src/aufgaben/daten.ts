// Lädt die Aufgabentabelle (CSV) und die Dialogtabelle.
// Quelle ist entweder eine lokale Datei in public/daten/ oder ein als CSV
// veröffentlichtes Google Sheet (Adresse in public/daten/einstellungen.json).

import Papa from 'papaparse';

export type AufgabenTyp =
  | 'multiple_choice'
  | 'wahr_falsch'
  | 'lueckentext'
  | 'zuordnen'
  | 'reihenfolge'
  | 'zahl'
  | 'bild_klick'
  | 'dialog';

export interface Aufgabe {
  id: string;
  pakete: string[];
  fach: string;
  sprache: string;
  typ: AufgabenTyp;
  ort: string;
  figur: string;
  frage: string;
  antworten: string[];
  richtig: string[];
  medien: string;
  hinweis: string;
  punkte: number;
  quelle: string;
}

export interface DialogSchritt {
  dialog: string;
  schritt: string;
  sprecher: string;
  text: string;
  optionen: { text: string; richtig: boolean; weiter: string }[];
  hinweis: string;
}

export interface Einstellungen {
  aufgabenQuelle: string;
  dialogQuelle: string;
}

const TYPEN: AufgabenTyp[] = [
  'multiple_choice', 'wahr_falsch', 'lueckentext', 'zuordnen',
  'reihenfolge', 'zahl', 'bild_klick', 'dialog',
];

function liste(s: string | undefined): string[] {
  return (s ?? '').split('|').map((x) => x.trim()).filter((x) => x !== '');
}

async function ladeCsv(url: string): Promise<Record<string, string>[]> {
  const antwort = await fetch(url, { cache: 'no-cache' });
  if (!antwort.ok) throw new Error(`${url}: ${antwort.status}`);
  const text = await antwort.text();
  const erg = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  return erg.data;
}

function basis(pfad: string): string {
  // relative Pfade beziehen sich auf den Spielordner
  return /^https?:/.test(pfad) ? pfad : new URL(pfad, document.baseURI).href;
}

export async function ladeEinstellungen(): Promise<Einstellungen> {
  const standard = { aufgabenQuelle: 'daten/aufgaben.csv', dialogQuelle: 'daten/dialoge.csv' };
  try {
    const r = await fetch(basis('daten/einstellungen.json'), { cache: 'no-cache' });
    if (!r.ok) return standard;
    const e = await r.json();
    return {
      aufgabenQuelle: e.aufgabenQuelle || standard.aufgabenQuelle,
      dialogQuelle: e.dialogQuelle || standard.dialogQuelle,
    };
  } catch {
    return standard;
  }
}

export async function ladeAufgaben(quelle: string): Promise<{ aufgaben: Aufgabe[]; warnungen: string[] }> {
  const zeilen = await ladeCsv(basis(quelle));
  const aufgaben: Aufgabe[] = [];
  const warnungen: string[] = [];
  const ids = new Set<string>();
  zeilen.forEach((z, i) => {
    const id = (z.id ?? '').trim();
    const typ = (z.typ ?? '').trim().toLowerCase() as AufgabenTyp;
    if (!id) return; // leere Zeile
    if (ids.has(id)) { warnungen.push(`Zeile ${i + 2}: id "${id}" doppelt`); return; }
    if (!TYPEN.includes(typ)) { warnungen.push(`Zeile ${i + 2}: unbekannter Typ "${z.typ}"`); return; }
    ids.add(id);
    aufgaben.push({
      id,
      pakete: (z.paket ?? '').split(',').map((p) => p.trim().toLowerCase()).filter(Boolean),
      fach: (z.fach ?? '').trim(),
      sprache: (z.sprache ?? '').trim(),
      typ,
      ort: (z.ort ?? '').trim(),
      figur: (z.figur ?? '').trim(),
      frage: (z.frage ?? '').trim(),
      antworten: liste(z.antworten),
      richtig: liste(z.richtig),
      medien: (z.medien ?? '').trim(),
      hinweis: (z.hinweis ?? '').trim(),
      punkte: Math.max(1, parseInt(z.punkte ?? '', 10) || 10),
      quelle: (z.quelle ?? '').trim(),
    });
  });
  return { aufgaben, warnungen };
}

export async function ladeDialoge(quelle: string): Promise<Map<string, DialogSchritt[]>> {
  const karte = new Map<string, DialogSchritt[]>();
  let zeilen: Record<string, string>[] = [];
  try { zeilen = await ladeCsv(basis(quelle)); } catch { return karte; }
  for (const z of zeilen) {
    const dialog = (z.dialog ?? '').trim();
    if (!dialog) continue;
    // Optionen: "*richtige Antwort>nächster Schritt | falsche Antwort"
    const optionen = liste(z.optionen).map((o) => {
      const richtig = o.startsWith('*');
      const [text, weiter] = o.replace(/^\*/, '').split('>');
      return { text: text.trim(), richtig, weiter: (weiter ?? '').trim() };
    });
    const schritt: DialogSchritt = {
      dialog,
      schritt: (z.schritt ?? '').trim(),
      sprecher: (z.sprecher ?? '').trim(),
      text: (z.text ?? '').trim(),
      optionen,
      hinweis: (z.hinweis ?? '').trim(),
    };
    if (!karte.has(dialog)) karte.set(dialog, []);
    karte.get(dialog)!.push(schritt);
  }
  return karte;
}

export function aufgabenFuerPaket(alle: Aufgabe[], paket: string): Aufgabe[] {
  return alle.filter((a) => a.pakete.includes(paket));
}

export function medienUrl(datei: string): string {
  return basis(/^https?:/.test(datei) ? datei : `medien/${datei}`);
}
