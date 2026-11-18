// Zeigt eine Aufgabe als Fenster über der Spielwelt und prüft die Antwort.

import { t } from '../i18n';
import { Aufgabe, DialogSchritt, medienUrl } from './daten';

export interface Ergebnis {
  geloest: boolean;
  versuche: number;
}

interface Pruefer {
  el: HTMLElement;
  pruefe: () => boolean;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, klasse = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (klasse) e.className = klasse;
  if (text) e.textContent = text;
  return e;
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[’`]/g, "'");
}

function mischen<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function mischenAnders<T>(a: T[]): T[] {
  if (a.length < 2) return [...a];
  let b = mischen(a);
  for (let i = 0; i < 10 && b.every((x, k) => x === a[k]); i++) b = mischen(a);
  return b;
}

function medium(datei: string): HTMLElement | null {
  if (!datei) return null;
  const url = medienUrl(datei);
  const endung = datei.split('.').pop()?.toLowerCase() ?? '';
  if (['mp3', 'ogg', 'wav', 'm4a'].includes(endung)) {
    const a = el('audio', 'medium');
    a.controls = true; a.preload = 'metadata'; a.src = url;
    return a;
  }
  if (['mp4', 'webm'].includes(endung)) {
    const v = el('video', 'medium');
    v.controls = true; v.preload = 'metadata'; v.playsInline = true; v.src = url;
    return v;
  }
  const i = el('img', 'medium');
  i.src = url; i.alt = '';
  return i;
}

// ---------- einzelne Aufgabentypen ----------

function multipleChoice(a: Aufgabe): Pruefer {
  const mehrere = a.richtig.length > 1;
  const box = el('div', 'optionen');
  const name = `mc-${a.id}`;
  const inputs: HTMLInputElement[] = [];
  for (const o of a.antworten) {
    const lab = el('label', 'option');
    const inp = el('input');
    inp.type = mehrere ? 'checkbox' : 'radio';
    inp.name = name; inp.value = o;
    inputs.push(inp);
    lab.append(inp, el('span', '', o));
    box.append(lab);
  }
  return {
    el: box,
    pruefe: () => {
      const gewaehlt = inputs.filter((i) => i.checked).map((i) => norm(i.value)).sort();
      const soll = a.richtig.map(norm).sort();
      return gewaehlt.length === soll.length && gewaehlt.every((g, k) => g === soll[k]);
    },
  };
}

function wahrFalsch(a: Aufgabe): Pruefer {
  const box = el('div', 'optionen reihe');
  const name = `wf-${a.id}`;
  const werte: [string, string][] = [['wahr', t().wahr], ['falsch', t().falschAntwort]];
  const inputs: HTMLInputElement[] = [];
  for (const [wert, text] of werte) {
    const lab = el('label', 'option');
    const inp = el('input');
    inp.type = 'radio'; inp.name = name; inp.value = wert;
    inputs.push(inp);
    lab.append(inp, el('span', '', text));
    box.append(lab);
  }
  const soll = ['wahr', 'true', 'richtig', 'ja', 'yes'].includes(norm(a.richtig[0] ?? '')) ? 'wahr' : 'falsch';
  return { el: box, pruefe: () => inputs.find((i) => i.checked)?.value === soll };
}

function lueckentext(a: Aufgabe): Pruefer {
  // Lücken im Fragetext: ___ (drei oder mehr Unterstriche)
  const box = el('div', 'lueckentext');
  const teile = a.frage.split(/_{3,}/);
  const felder: (HTMLInputElement | HTMLSelectElement)[] = [];
  teile.forEach((teil, i) => {
    box.append(document.createTextNode(teil));
    if (i < teile.length - 1) {
      let f: HTMLInputElement | HTMLSelectElement;
      if (a.antworten.length) {
        const s = el('select');
        s.append(new Option(t().waehlen, ''));
        a.antworten.forEach((o) => s.append(new Option(o, o)));
        f = s;
      } else {
        const inp = el('input');
        inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false;
        inp.setAttribute('autocapitalize', 'off');
        inp.size = Math.max(6, (a.richtig[i] ?? '').split('/')[0].length + 2);
        f = inp;
      }
      f.className = 'luecke';
      felder.push(f);
      box.append(f);
    }
  });
  return {
    el: box,
    pruefe: () => felder.every((f, i) => {
      const erlaubt = (a.richtig[i] ?? '').split('/').map(norm);
      return erlaubt.includes(norm(f.value));
    }),
  };
}

function zuordnen(a: Aufgabe): Pruefer {
  // antworten: "Begriff = Gegenstück | …"
  const paare = a.antworten.map((p) => {
    const [l, ...r] = p.split('=');
    return [l.trim(), r.join('=').trim()] as [string, string];
  });
  const rechts = mischen(paare.map((p) => p[1]));
  const box = el('div', 'zuordnen');
  box.append(el('p', 'hilfe', t().zuordnenHilfe));
  const selects: HTMLSelectElement[] = [];
  for (const [links] of paare) {
    const zeile = el('div', 'paar');
    const s = el('select');
    s.append(new Option(t().waehlen, ''));
    rechts.forEach((r) => s.append(new Option(r, r)));
    selects.push(s);
    zeile.append(el('span', 'links', links), s);
    box.append(zeile);
  }
  return { el: box, pruefe: () => selects.every((s, i) => s.value === paare[i][1]) };
}

function reihenfolge(a: Aufgabe): Pruefer {
  const box = el('div', 'reihenfolge');
  box.append(el('p', 'hilfe', t().reihenfolgeHilfe));
  const liste = el('ol');
  let ordnung = mischenAnders(a.antworten);
  const zeichne = () => {
    liste.replaceChildren();
    ordnung.forEach((eintrag, i) => {
      const li = el('li');
      const hoch = el('button', 'klein', '▲');
      const runter = el('button', 'klein', '▼');
      hoch.disabled = i === 0;
      runter.disabled = i === ordnung.length - 1;
      hoch.onclick = () => { [ordnung[i - 1], ordnung[i]] = [ordnung[i], ordnung[i - 1]]; zeichne(); };
      runter.onclick = () => { [ordnung[i + 1], ordnung[i]] = [ordnung[i], ordnung[i + 1]]; zeichne(); };
      li.append(el('span', 'eintrag', eintrag), hoch, runter);
      liste.append(li);
    });
  };
  zeichne();
  box.append(liste);
  return { el: box, pruefe: () => ordnung.every((x, i) => x === a.antworten[i]) };
}

function zahl(a: Aufgabe): Pruefer {
  // richtig: "42" oder "42±2" oder "42+-2"
  const [wertS, tolS] = (a.richtig[0] ?? '0').replace('+-', '±').split('±');
  const zahlAus = (s: string) => parseFloat(s.replace(/\s/g, '').replace(',', '.'));
  const soll = zahlAus(wertS);
  const toleranz = tolS ? Math.abs(zahlAus(tolS)) : 1e-9;
  const box = el('div', 'zahl');
  const inp = el('input');
  inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off';
  box.append(inp);
  return {
    el: box,
    pruefe: () => {
      const ist = zahlAus(inp.value);
      return Number.isFinite(ist) && Math.abs(ist - soll) <= toleranz;
    },
  };
}

function bildKlick(a: Aufgabe): Pruefer {
  // richtig: "x,y,r" in Prozent der Bildbreite/-höhe (r in Prozent der Breite)
  const [x, y, r] = (a.richtig[0] ?? '50,50,10').split(',').map((s) => parseFloat(s));
  const box = el('div', 'bildklick');
  box.append(el('p', 'hilfe', t().bildHilfe));
  const rahmen = el('div', 'bildrahmen');
  const img = el('img');
  img.src = medienUrl(a.medien); img.alt = '';
  const punkt = el('div', 'markierung');
  punkt.hidden = true;
  let wahl: [number, number] | null = null;
  rahmen.addEventListener('click', (e) => {
    const b = img.getBoundingClientRect();
    wahl = [((e.clientX - b.left) / b.width) * 100, ((e.clientY - b.top) / b.height) * 100];
    punkt.hidden = false;
    punkt.style.left = `${wahl[0]}%`;
    punkt.style.top = `${wahl[1]}%`;
  });
  rahmen.append(img, punkt);
  box.append(rahmen);
  return {
    el: box,
    pruefe: () => {
      if (!wahl) return false;
      const seitenverh = img.naturalHeight / Math.max(1, img.naturalWidth);
      const dx = wahl[0] - x;
      const dy = (wahl[1] - y) * seitenverh; // in Breiten-Prozent umrechnen
      return Math.hypot(dx, dy) <= r;
    },
  };
}

// ---------- Fenster ----------

function fenster(titel: string, untertitel: string) {
  const hinter = el('div', 'fenster-hintergrund');
  const f = el('div', 'fenster');
  f.setAttribute('role', 'dialog');
  f.setAttribute('aria-modal', 'true');
  const kopf = el('div', 'fenster-kopf');
  const titelBox = el('div');
  titelBox.append(el('div', 'fenster-titel', titel));
  if (untertitel) titelBox.append(el('div', 'fenster-untertitel', untertitel));
  const zu = el('button', 'zu', '×');
  zu.setAttribute('aria-label', t().schliessen);
  kopf.append(titelBox, zu);
  const inhalt = el('div', 'fenster-inhalt');
  const fuss = el('div', 'fenster-fuss');
  f.append(kopf, inhalt, fuss);
  hinter.append(f);
  document.body.append(hinter);
  return { hinter, inhalt, fuss, zu };
}

function untertitel(a: Aufgabe): string {
  return [a.fach, a.figur].filter(Boolean).join(' · ');
}

export function zeigeAufgabe(
  a: Aufgabe,
  dialoge: Map<string, DialogSchritt[]>,
  schonGeloest: boolean,
): Promise<Ergebnis> {
  if (a.typ === 'dialog') return zeigeDialog(a, dialoge.get(a.frage) ?? [], schonGeloest);

  return new Promise((fertig) => {
    const { hinter, inhalt, fuss, zu } = fenster(t().station, untertitel(a));
    if (a.typ !== 'lueckentext') inhalt.append(el('p', 'frage', a.frage));
    if (a.typ !== 'bild_klick') {
      const m = medium(a.medien);
      if (m) inhalt.append(m);
    }
    const p: Pruefer = {
      multiple_choice: multipleChoice,
      wahr_falsch: wahrFalsch,
      lueckentext,
      zuordnen,
      reihenfolge,
      zahl,
      bild_klick: bildKlick,
    }[a.typ as Exclude<typeof a.typ, 'dialog'>](a);
    inhalt.append(p.el);
    if (a.quelle) inhalt.append(el('p', 'quelle', `${t().quelle}: ${a.quelle}`));

    const meldung = el('div', 'meldung');
    meldung.setAttribute('aria-live', 'polite');
    const knopf = el('button', 'haupt', t().pruefen);
    fuss.append(meldung, knopf);
    if (schonGeloest) meldung.textContent = t().schonGeloest;

    let versuche = 0;
    let geloest = false;
    const ende = () => {
      hinter.remove();
      document.removeEventListener('keydown', taste);
      fertig({ geloest, versuche });
    };
    const taste = (e: KeyboardEvent) => { if (e.key === 'Escape') ende(); };
    document.addEventListener('keydown', taste);
    zu.onclick = ende;
    knopf.onclick = () => {
      if (geloest) { ende(); return; }
      versuche++;
      if (p.pruefe()) {
        geloest = true;
        meldung.className = 'meldung gut';
        meldung.textContent = t().richtig;
        knopf.textContent = t().weiter;
        inhalt.querySelectorAll('input, select, button').forEach((x) => ((x as HTMLInputElement).disabled = true));
      } else {
        meldung.className = 'meldung schlecht';
        meldung.textContent = `${t().falsch}${a.hinweis && versuche >= 1 ? ` ${t().hinweis}: ${a.hinweis}` : ''}`;
      }
    };
  });
}

function zeigeDialog(a: Aufgabe, schritte: DialogSchritt[], schonGeloest: boolean): Promise<Ergebnis> {
  return new Promise((fertig) => {
    const { hinter, inhalt, fuss, zu } = fenster(a.figur || t().station, a.fach);
    const meldung = el('div', 'meldung');
    meldung.setAttribute('aria-live', 'polite');
    fuss.append(meldung);
    if (schonGeloest) meldung.textContent = t().schonGeloest;
    const verlauf = el('div', 'dialog-verlauf');
    const optionen = el('div', 'dialog-optionen');
    if (a.frage && !schritte.length) verlauf.append(el('p', 'fehler', `Dialog "${a.frage}" fehlt in der Dialogtabelle.`));
    inhalt.append(verlauf, optionen);

    let versuche = 1;
    let geloest = false;
    const ende = () => { hinter.remove(); fertig({ geloest, versuche }); };
    zu.onclick = ende;

    const sprechblase = (wer: string, text: string, eigen = false) => {
      const b = el('div', eigen ? 'blase eigen' : 'blase');
      if (wer) b.append(el('div', 'sprecher', wer));
      b.append(el('div', '', text));
      verlauf.append(b);
      verlauf.scrollTop = verlauf.scrollHeight;
    };

    const zeige = (id: string) => {
      const s = schritte.find((x) => x.schritt === id) ?? (id === '' ? schritte[0] : undefined);
      optionen.replaceChildren();
      if (!s) return;
      sprechblase(s.sprecher, s.text);
      if (!s.optionen.length) {
        geloest = true;
        meldung.className = 'meldung gut';
        meldung.textContent = t().richtig;
        const w = el('button', 'haupt', t().weiter);
        w.onclick = ende;
        optionen.append(w);
        return;
      }
      for (const o of mischen(s.optionen)) {
        const b = el('button', 'antwort', o.text);
        b.onclick = () => {
          if (o.richtig) {
            meldung.textContent = '';
            meldung.className = 'meldung';
            sprechblase('', o.text, true);
            zeige(o.weiter);
          } else {
            versuche++;
            b.disabled = true;
            meldung.className = 'meldung schlecht';
            meldung.textContent = `${t().falsch}${s.hinweis ? ` ${t().hinweis}: ${s.hinweis}` : ''}`;
          }
        };
        optionen.append(b);
      }
    };
    const m = medium(a.medien);
    if (m) verlauf.append(m);
    zeige(schritte[0]?.schritt ?? '');
  });
}
