// Abschlusscode: kompakt, kopierbar, mit Prüfsumme gegen Tippfehler und
// einfaches Herumbasteln. Kein echter Fälschungsschutz (der Schlüssel liegt
// im Browser), für eine Übung reicht das.

const SALZ = 'grg15-schmelz';

export interface CodeInhalt {
  paket: string;
  kuerzel: string;
  datum: string; // JJJJ-MM-TT
  loesungen: [string, number, number][]; // [aufgaben-id, punkte, versuche]
}

function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(7, '0').slice(-6);
}

function zuBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function vonBase64Url(s: string): string {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function erzeugeCode(i: CodeInhalt): string {
  const roh = JSON.stringify([1, i.paket, i.kuerzel, i.datum, i.loesungen]);
  const daten = zuBase64Url(roh);
  return `SCHMELZ-${fnv(SALZ + daten)}-${daten}`;
}

export function leseCode(code: string): { inhalt: CodeInhalt; echt: boolean } | null {
  const sauber = code.replace(/\s+/g, '');
  const m = /^SCHMELZ-([0-9A-Z]{6})-([A-Za-z0-9_-]+)$/.exec(sauber);
  if (!m) return null;
  try {
    const arr = JSON.parse(vonBase64Url(m[2]));
    if (!Array.isArray(arr) || arr[0] !== 1) return null;
    return {
      inhalt: { paket: arr[1], kuerzel: arr[2], datum: arr[3], loesungen: arr[4] },
      echt: fnv(SALZ + m[2]) === m[1],
    };
  } catch {
    return null;
  }
}
