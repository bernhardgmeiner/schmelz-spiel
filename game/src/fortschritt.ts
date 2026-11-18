// Punkte, Abzeichen und Speicherstand (nur lokal im Browser).

import { Aufgabe } from './aufgaben/daten';

export interface Loesung {
  punkte: number;
  versuche: number;
}

interface Stand {
  geloest: Record<string, Loesung>;
  kuerzel: string;
}

export interface Abzeichen {
  id: string;
  name: { de: string; en: string };
  symbol: string;
}

export function punkteFuer(max: number, versuche: number): number {
  if (versuche <= 1) return max;
  if (versuche === 2) return Math.ceil(max / 2);
  return Math.max(1, Math.ceil(max / 4));
}

export class Fortschritt {
  private stand: Stand = { geloest: {}, kuerzel: '' };
  private schluessel: string;

  constructor(public paket: string, private aufgaben: Aufgabe[]) {
    this.schluessel = `schmelz:v1:${paket}`;
    try {
      const roh = localStorage.getItem(this.schluessel);
      if (roh) {
        const s = JSON.parse(roh);
        if (s && typeof s.geloest === 'object') this.stand = { geloest: s.geloest, kuerzel: s.kuerzel ?? '' };
      }
    } catch { /* ohne Speicher: Fortschritt gilt nur bis zum Neuladen */ }
  }

  private speichern() {
    try { localStorage.setItem(this.schluessel, JSON.stringify(this.stand)); } catch { /* egal */ }
  }

  istGeloest(id: string) { return id in this.stand.geloest; }

  get geloest() { return this.stand.geloest; }

  get punkte() {
    return Object.values(this.stand.geloest).reduce((s, l) => s + l.punkte, 0);
  }

  get anzahlGeloest() {
    return this.aufgaben.filter((a) => this.istGeloest(a.id)).length;
  }

  get kuerzel() { return this.stand.kuerzel; }
  set kuerzel(k: string) { this.stand.kuerzel = k; this.speichern(); }

  /** Trägt eine Lösung ein, gibt neu erworbene Abzeichen zurück. */
  loese(a: Aufgabe, versuche: number): { punkte: number; neu: Abzeichen[] } {
    if (this.istGeloest(a.id)) return { punkte: 0, neu: [] };
    const vorher = new Set(this.abzeichen().map((x) => x.id));
    const punkte = punkteFuer(a.punkte, versuche);
    this.stand.geloest[a.id] = { punkte, versuche };
    this.speichern();
    const neu = this.abzeichen().filter((x) => !vorher.has(x.id));
    return { punkte, neu };
  }

  zuruecksetzen() {
    this.stand = { geloest: {}, kuerzel: this.stand.kuerzel };
    this.speichern();
  }

  abzeichen(): Abzeichen[] {
    const liste: Abzeichen[] = [];
    const n = this.anzahlGeloest;
    if (n >= 1) liste.push({ id: 'erste', name: { de: 'Erste Station', en: 'First station' }, symbol: '★' });
    // ein Abzeichen pro Fach, wenn alle Aufgaben des Fachs gelöst sind
    const faecher = new Map<string, Aufgabe[]>();
    for (const a of this.aufgaben) {
      if (!a.fach) continue;
      if (!faecher.has(a.fach)) faecher.set(a.fach, []);
      faecher.get(a.fach)!.push(a);
    }
    if (faecher.size > 1) {
      for (const [fach, liste2] of faecher) {
        if (liste2.every((a) => this.istGeloest(a.id))) {
          liste.push({ id: `fach:${fach}`, name: { de: `${fach} komplett`, en: `${fach} complete` }, symbol: '◆' });
        }
      }
    }
    const ohneFehler = Object.values(this.stand.geloest).filter((l) => l.versuche <= 1).length;
    if (ohneFehler >= 3) liste.push({ id: 'treffsicher', name: { de: 'Treffsicher (3× im ersten Versuch)', en: 'Sharpshooter (3× first try)' }, symbol: '◎' });
    if (this.aufgaben.length && n === this.aufgaben.length) {
      liste.push({ id: 'paket', name: { de: 'Paket abgeschlossen', en: 'Pack completed' }, symbol: '♛' });
    }
    return liste;
  }
}
