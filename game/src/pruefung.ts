import { leseCode } from './code';
import { ladeEinstellungen, ladeAufgaben, Aufgabe } from './aufgaben/daten';

let aufgaben: Aufgabe[] = [];
ladeEinstellungen()
  .then((e) => ladeAufgaben(e.aufgabenQuelle))
  .then((r) => { aufgaben = r.aufgaben; })
  .catch(() => { /* ohne Tabelle: nur Codes anzeigen */ });

const zelle = (text: string, klasse = '') => {
  const td = document.createElement('td');
  td.textContent = text;
  if (klasse) td.className = klasse;
  return td;
};

document.getElementById('pruefen')!.onclick = () => {
  const text = (document.getElementById('eingabe') as HTMLTextAreaElement).value;
  const codes = text.match(/SCHMELZ-[0-9A-Z]{6}-[A-Za-z0-9_-]+/g) ?? [];
  const tabelle = document.getElementById('tabelle')!;
  const body = tabelle.querySelector('tbody')!;
  body.replaceChildren();
  for (const c of codes) {
    const tr = document.createElement('tr');
    const r = leseCode(c);
    if (!r) {
      tr.append(zelle('–'), zelle('–'), zelle('–'), zelle('–'), zelle('–'), zelle('nicht lesbar', 'nein'), zelle(c.slice(0, 30) + '…'));
    } else {
      const { inhalt, echt } = r;
      const imPaket = aufgaben.filter((a) => a.pakete.includes(inhalt.paket)).length;
      const punkte = inhalt.loesungen.reduce((s, l) => s + l[1], 0);
      const details = inhalt.loesungen
        .map(([id, p, v]) => `${id} (${p}/${v})`)
        .join(', ');
      tr.append(
        zelle(inhalt.kuerzel || '–'),
        zelle(inhalt.paket),
        zelle(inhalt.datum),
        zelle(imPaket ? `${inhalt.loesungen.length}/${imPaket}` : String(inhalt.loesungen.length)),
        zelle(String(punkte)),
        zelle(echt ? 'ja' : 'NEIN', echt ? 'ok' : 'nein'),
        zelle(details),
      );
    }
    body.append(tr);
  }
  tabelle.hidden = codes.length === 0;
};
