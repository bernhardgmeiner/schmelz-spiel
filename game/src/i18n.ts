// Texte der Oberfläche. Aufgabentexte kommen aus der Tabelle, nicht von hier.

export type Lang = 'de' | 'en';

const texte = {
  de: {
    titel: 'Schmelz-Spiel',
    untertitel: 'GRG 15 Auf der Schmelz',
    start: 'Los geht\'s',
    weiter: 'Weiter',
    laden: 'Lade die Schule …',
    paket: 'Aufgabenpaket',
    demo: 'Demo-Stationen',
    steuerungTitel: 'Steuerung',
    steuerungPc: 'Gehen: W A S D oder Pfeiltasten · Laufen: Umschalt · Umsehen: Maus gedrückt halten und ziehen · Station öffnen: E',
    steuerungTouch: 'Gehen: Joystick links · Umsehen: rechts wischen · Station öffnen: Knopf rechts unten',
    steuerungZiel: 'Leuchtende Säulen sind Stationen mit Aufgaben. Für jede gelöste Aufgabe gibt es Punkte, für manche Ziele Abzeichen. Dein Fortschritt bleibt in diesem Browser gespeichert.',
    punkte: 'Punkte',
    stationen: 'Stationen',
    oeffnen: 'Öffnen',
    station: 'Station',
    pruefen: 'Prüfen',
    schliessen: 'Schließen',
    richtig: 'Richtig!',
    falsch: 'Noch nicht richtig.',
    hinweis: 'Hinweis',
    versuch: 'Versuch',
    geloest: 'Gelöst',
    punkteErhalten: (p: number) => `+${p} Punkte`,
    schonGeloest: 'Diese Station hast du schon gelöst.',
    abzeichenNeu: 'Neues Abzeichen',
    abschluss: 'Abschluss',
    abschlussTitel: 'Abschlusscode',
    abschlussText: 'Gib diesen Code deiner Lehrkraft ab, z. B. kopiert in Teams oder als Screenshot. Der Code enthält nur das Paket, deine gelösten Aufgaben, Punkte, Datum und das Kürzel, das du hier einträgst.',
    kuerzel: 'Kürzel oder Name (freiwillig)',
    kopieren: 'Code kopieren',
    kopiert: 'Kopiert!',
    hilfe: 'Hilfe',
    sprache: 'EN',
    neustart: 'Fortschritt löschen',
    neustartFrage: 'Fortschritt für dieses Paket wirklich löschen?',
    abzeichen: 'Abzeichen',
    keineAbzeichen: 'Noch keine Abzeichen.',
    reihenfolgeHilfe: 'Bring die Einträge mit ▲ ▼ in die richtige Reihenfolge.',
    zuordnenHilfe: 'Wähle zu jedem Begriff das passende Gegenstück.',
    bildHilfe: 'Klick auf die richtige Stelle im Bild.',
    waehlen: '– wählen –',
    wahr: 'Wahr',
    falschAntwort: 'Falsch',
    fehlerLaden: 'Die Aufgaben konnten nicht geladen werden.',
    keineAufgaben: 'In diesem Paket gibt es keine Aufgaben.',
    alleGeloest: 'Alle Stationen gelöst! Hol dir jetzt deinen Abschlusscode.',
    quelle: 'Quelle',
  },
  en: {
    titel: 'Schmelz Game',
    untertitel: 'GRG 15 Auf der Schmelz',
    start: 'Let\'s go',
    weiter: 'Next',
    laden: 'Loading the school …',
    paket: 'Task pack',
    demo: 'Demo stations',
    steuerungTitel: 'Controls',
    steuerungPc: 'Walk: W A S D or arrow keys · Run: Shift · Look around: hold mouse button and drag · Open station: E',
    steuerungTouch: 'Walk: joystick on the left · Look around: swipe on the right · Open station: button bottom right',
    steuerungZiel: 'Glowing pillars are stations with tasks. You get points for every task you solve and badges for some goals. Your progress is saved in this browser.',
    punkte: 'Points',
    stationen: 'Stations',
    oeffnen: 'Open',
    station: 'Station',
    pruefen: 'Check',
    schliessen: 'Close',
    richtig: 'Correct!',
    falsch: 'Not quite right yet.',
    hinweis: 'Hint',
    versuch: 'Attempt',
    geloest: 'Solved',
    punkteErhalten: (p: number) => `+${p} points`,
    schonGeloest: 'You have already solved this station.',
    abzeichenNeu: 'New badge',
    abschluss: 'Finish',
    abschlussTitel: 'Completion code',
    abschlussText: 'Hand this code in to your teacher, e.g. pasted into Teams or as a screenshot. The code only contains the pack, the tasks you solved, points, date and the initials you enter here.',
    kuerzel: 'Initials or name (optional)',
    kopieren: 'Copy code',
    kopiert: 'Copied!',
    hilfe: 'Help',
    sprache: 'DE',
    neustart: 'Reset progress',
    neustartFrage: 'Really delete your progress for this pack?',
    abzeichen: 'Badges',
    keineAbzeichen: 'No badges yet.',
    reihenfolgeHilfe: 'Use ▲ ▼ to put the items in the right order.',
    zuordnenHilfe: 'Choose the matching item for each term.',
    bildHilfe: 'Click the right spot in the picture.',
    waehlen: '– choose –',
    wahr: 'True',
    falschAntwort: 'False',
    fehlerLaden: 'The tasks could not be loaded.',
    keineAufgaben: 'There are no tasks in this pack.',
    alleGeloest: 'All stations solved! Get your completion code now.',
    quelle: 'Source',
  },
};

export type Texte = typeof texte.de;

function startSprache(): Lang {
  try {
    const s = localStorage.getItem('schmelz:sprache');
    if (s === 'de' || s === 'en') return s;
  } catch { /* kein Speicher verfügbar */ }
  return navigator.language.startsWith('de') ? 'de' : 'en';
}

let aktuell: Lang = startSprache();
const hoerer: Array<() => void> = [];

export function t(): Texte {
  return texte[aktuell];
}

export function sprache(): Lang {
  return aktuell;
}

export function setzeSprache(l: Lang) {
  aktuell = l;
  try { localStorage.setItem('schmelz:sprache', l); } catch { /* egal */ }
  document.documentElement.lang = l;
  hoerer.forEach((f) => f());
}

export function beiSprachwechsel(f: () => void) {
  hoerer.push(f);
}
