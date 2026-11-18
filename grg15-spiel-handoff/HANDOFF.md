# Handoff: 3D-Rollenspiel rund um das GRG 15 Auf der Schmelz

Stand: 18. November 2026. Verfasst am Ende des Vorgänger-Threads, in dem das SketchUp-Modell der Schule in ein Web-3D-Format umgewandelt wurde. Dieses Dokument ist für Claude im neuen Thread geschrieben; Bernhard liest mit.

## 1. Worum es geht

Bernhard Gmeiner unterrichtet am GRG 15 Auf der Schmelz in Wien (Englisch, Geographie und wirtschaftliche Bildung). Er will ein 3D-Rollenspiel, in dem man sich frei durch das Schulgelände bewegt: rund um die Schule und auch im Gebäude. Unterwegs gibt es unterschiedliche Aufgaben. Grundlage ist ein vorhandenes 3D-Modell der Schule (liegt bei, siehe Abschnitt 3). Fotos vom Gebäude innen und außen sowie Satellitenbilder liefert Bernhard nach.

Was das Spiel inhaltlich sein soll, für wen es ist und wie es technisch gebaut wird, ist **noch offen**. Genau das klärt dieser Thread zuerst.

## 2. Dein Auftrag, Claude

Arbeite in vier Phasen. Wechsle erst in die nächste Phase, wenn Bernhard die vorige freigegeben hat.

**Phase 1: Fragen stellen (kein Code).** Interviewe Bernhard mit dem Fragenkatalog in Abschnitt 7. Stell höchstens vier Fragen pro Runde, nutze dafür das Frage-Werkzeug mit Auswahlmöglichkeiten, wo es eines gibt, und markiere deine Empfehlung. Nach jeder Runde fasst du in zwei, drei Sätzen zusammen, was jetzt feststeht. Frag nach, wenn eine Antwort neue Fragen aufwirft; der Katalog ist ein Startpunkt, keine Checkliste zum Abhaken. Rechne mit fünf bis acht Runden.

**Phase 2: Game-Design-Dokument.** Schreib aus den Antworten ein kurzes Design-Dokument (Spielidee, Zielgruppe, Spielablauf, Aufgabentypen, Welt und Räume, Steuerung, Technik, Umfang des ersten Prototyps, offene Punkte). Bernhard gibt es frei oder ändert es.

**Phase 3: Asset-Plan.** Leg fest, welche Fotos, Pläne und Satellitenbilder Bernhard in welcher Form liefern soll (Dateiformat, Perspektive, Benennung, Ordnerstruktur), und was aus offenen Daten kommt.

**Phase 4: Prototyp.** Bau einen spielbaren Ausschnitt (vertical slice): ein Stück Außengelände, der Haupteingang, ein Innenraum, eine funktionierende Aufgabe. Erst danach wird erweitert.

Lege das Projekt früh in einem GitHub-Repository ab. Cloud-Sessions sind flüchtig; was nicht gepusht ist, ist beim nächsten Mal weg.

## 3. Was im Paket liegt

```
grg15-spiel-handoff/
├── START-PROMPT.md            der Text, mit dem Bernhard den Thread startet
├── HANDOFF.md                 dieses Dokument
├── modell/
│   ├── grg15-gebaeude.glb     das Gebäude als glTF-Binary, mit Texturen, in Metern
│   ├── schmelz-original.skp   Originaldatei aus SketchUp 2021 (Quelle von allem)
│   ├── meshes.json            welches Mesh welches Material und welche Textur hat
│   └── konvertieren.py        Skript, das die .glb aus der .skp neu erzeugt
├── texturen/                  die 13 Fassadentexturen als einzelne PNGs
└── vorschau/                  4 Renderings des Modells im Browser
```

Bewusst **nicht** dabei: die Version mit dem alten Google-Earth-Luftbild als Bodenplatte (Urheberrecht Google, siehe Abschnitt 6) und die Einbett-Vorlage für die Homepage (für das Spiel irrelevant).

## 4. Das 3D-Modell: Fakten

Das Modell stammt aus 3D Warehouse (Titel „Grg15 Auf der Schmelz“), gebaut in SketchUp, gespeichert im Format von SketchUp 2021. Bernhard hat das Okay des Erstellers für die Weiterverwendung.

Die Umwandlung lief mit OpenSKP 1.5.0 (Python, MIT-Lizenz, liest .skp ohne SketchUp-SDK). Danach wurden die Google-Earth-Ebenen entfernt und von Millimetern auf Meter skaliert. `modell/konvertieren.py` macht das reproduzierbar und ist am 18.11.2026 getestet worden (`pip install openskp==1.5.0 pillow trimesh`).

Kennzahlen von `grg15-gebaeude.glb`:

- Größe 160 KB, 15 Meshes, 1.332 Dreiecke. Das ist sehr wenig; es ist ein Low-Poly-Fassadenmodell.
- Achsen nach glTF-Standard: Y zeigt nach oben, 1 Einheit = 1 Meter.
- Ausdehnung 72,4 m (x) × 13,8 m (Höhe) × 100,4 m (z).
- Bounding Box von (−41,3 / −1,1 / −47,6) bis (31,1 / 12,7 / 52,9). Der Ursprung liegt ungefähr in der Mitte des Grundrisses, nicht an einer Gebäudeecke.
- Dachflächen liegen auf etwa 3,6 / 5,9 / 7,9 / 9,6 / 11,6 / 11,9 m. Der Hauptbau hat also vermutlich drei bis vier Geschosse; der Turnsaal-Trakt ist niedriger.
- Texturen: 13 Stück, alle winzig (19 bis 450 Pixel Kantenlänge). Material-Namen aus SketchUp: `fenster_haupt`, `fenster_dazwischen`, `fenster_rand`, `fenster_toilette`, `wand_normal`, `wand_muster`, `haupteingang`, `wand_turnsaal_normal`, `wand_turnsaal_fenster`, `turnsaal_tuer`, `glasdach`, `dach`, `dach_rand`. Ein großes Mesh (664 Dreiecke, vermutlich Wände und Laibungen) ist ungetextet weiß.
- Ebenen in der .skp: `Layer0` (das Gebäude), `zeichnung_plan`, `Google Earth Terrain`, `Google Earth Snapshot`.

Wie es aussieht, zeigen die Bilder in `vorschau/`: ein H-förmiger Hauptbau mit Innenhöfen und einem Glasdach, davor der Turnsaal-Trakt mit gelber Fassade.

### Grenzen des Modells (wichtig für die Planung)

Das Modell ist eine **reine Außenhülle**. Es gibt keine Geschossdecken, keine Innenwände, keine Räume und keine Treppen. Wer hineinläuft, steht in einem leeren, ungetexteten Hohlraum. Das gesamte Innere muss neu gebaut werden, aus Grundrissen und Bernhards Fotos.

Fenster und Türen sind nur auf die Fassade gemalt. Für einen begehbaren Eingang muss die Geometrie geöffnet werden.

Das Mesh ist nicht geschlossen (nicht wasserdicht). Für Kollisionen braucht das Spiel eigene, vereinfachte Collider-Boxen.

Die Texturen sind für eine Ego- oder Third-Person-Kamera aus der Nähe viel zu klein. Sie reichen als Platzhalter; für die Endfassung sind Bernhards Fotos besser.

Ein Gelände fehlt nach dem Entfernen der Google-Ebenen ganz. Das Original-Gelände hatte ohnehin nur 121 Punkte.

Die Nordrichtung ist nicht verifiziert. Wahrscheinlich zeigt −z nach Norden (übliche Umrechnung SketchUp → glTF), das muss aber gegen ein Luftbild geprüft werden, bevor Gelände und Gebäude zusammengesetzt werden.

## 5. Daten, die kommen (und was zusätzlich hilft)

Bernhard hat angekündigt: Satellitenbilder, Fotos vom Gebäude außen, Fotos vom Gebäude innen.

Was das Innere viel leichter macht und deshalb in Phase 1 erfragt werden soll: Grundrisse oder Fluchtwegpläne pro Geschoss (hängen in jeder Schule an den Wänden; ein Handyfoto reicht), ungefähre Raumhöhen, und welche Räume im Spiel überhaupt vorkommen sollen. Ein Spiel muss nicht jede Klasse abbilden.

Für die Umgebung gibt es in Österreich offene Daten, die vermutlich passen: basemap.at (Orthofotos, Lizenz CC BY 4.0) und die Open-Government-Data-Angebote der Stadt Wien (Orthofotos, Geländemodell, 3D-Baukörpermodell). Lizenzbedingungen und aktuelle Verfügbarkeit bitte vor der Verwendung prüfen; die Namensnennung muss dann ins Spiel (Credits).

## 6. Rechtliches und Datenschutz

Das Modell: Weiterverwendung vom Ersteller erlaubt (laut Bernhard). Den Ersteller in den Credits nennen, sofern er das will.

Das alte Google-Earth-Luftbild aus der .skp darf nicht ins Spiel. Es ist ein Google-Screenshot mit Logo und Bedienelementen.

Fotos aus dem Schulhaus: Bernhard weiß als Lehrer, worauf es ankommt. Trotzdem im Asset-Plan festhalten, dass auf den Fotos keine erkennbaren Schüler:innen sein dürfen, und keine Namensschilder, Stundenpläne oder Aushänge mit personenbezogenen Daten.

Falls echte Lehrer:innen als Figuren vorkommen sollen: nur mit deren Einwilligung, sonst erfundene Figuren.

Falls das Spiel Logins, Namen oder Speicherstände von Schüler:innen speichert, ist das ein Datenschutzthema (Schüler:innen sind großteils minderjährig). Die datenärmste Lösung ist der Standard: Speicherstand lokal im Browser, keine Konten.

## 7. Fragenkatalog für Phase 1

Die Reihenfolge ist ein Vorschlag. Was durch frühere Antworten schon klar ist, entfällt.

**Zweck und Publikum**
- Wofür ist das Spiel gedacht: Unterricht in einem bestimmten Fach, Orientierung für neue Schüler:innen (erste Klassen, Tag der offenen Tür), ein Schulprojekt, die Schulwebsite, Schmelzgespräche, etwas anderes?
- Wer spielt: Alter, Schulstufe, Vorwissen, Deutsch oder Englisch als Spielsprache (oder beides)?
- Wo wird gespielt: im Unterricht gemeinsam, als Hausübung, frei zugänglich im Netz?
- Wie lange dauert eine Spielsitzung, wie lange das ganze Spiel?
- Sollen Schüler:innen am Bau mitwirken (Fotos, Texte, Aufgaben, Level), etwa als Projekt?

**Spielidee**
- Welche Art Rollenspiel: Quest-Abenteuer mit Geschichte, Schnitzeljagd, Escape-Game, Detektivfall, Erkundung mit Sammelobjekten, Mischung?
- Gibt es eine Rahmengeschichte, eine Spielfigur mit Rolle (neue:r Schüler:in, Reporter:in, Hausmeister:in …)?
- Gibt es Figuren (NPCs), mit denen man spricht? Echt oder erfunden?
- Gibt es Fortschritt: Punkte, Abzeichen, Inventar, freischaltbare Räume, Ranglisten?
- Einzelspieler:in oder mehrere gleichzeitig?

**Aufgaben**
- Welche Aufgabentypen: Quizfragen, Englisch-Aufgaben (Lesen, Hören, Dialoge), Geographie-Aufgaben (Karte, Himmelsrichtung, Orientierung im Gelände), Rätsel, Sachen finden, Fotos aus der echten Schule wiedererkennen?
- Feste Aufgaben im Code oder ein einfacher Editor, damit Lehrer:innen später selbst Aufgaben anlegen (zum Beispiel über eine JSON- oder Tabellendatei)?
- Sollen Aufgaben an Orte gebunden sein (Turnsaal, Bibliothek, Haupteingang, Schulhof)?
- Braucht es eine Auswertung für Lehrer:innen (wer hat was gelöst)? Achtung Datenschutz.

**Welt**
- Wie weit reicht das Außengelände: nur Schulgrundstück, bis zur Straße, ein ganzer Block?
- Welche Innenräume kommen vor? Welche nicht?
- Gibt es Grundrisse oder Fluchtwegpläne?
- Optik: möglichst fotorealistisch mit echten Fotos als Texturen, oder stilisiert (Low-Poly, Comic, Voxel)? Stilisiert ist deutlich schneller zu bauen und verzeiht das grobe Modell.
- Tageszeit, Jahreszeit, Wetter: egal oder gewünscht?

**Steuerung und Plattform**
- Auf welchen Geräten: Schul-PCs, Laptops, Tablets, Handys, Chromebooks? Müssen schwache Geräte flüssig laufen?
- Perspektive: Ego (first person), Schulterblick (third person) oder von oben?
- Steuerung mit Tastatur und Maus, Touch, beides?
- Muss es ohne Installation im Browser laufen? Offline?
- Wo wird es gehostet: Schulwebsite, eigene Domain, GitHub Pages, itch.io?

**Technik**
- Gibt es Vorlieben oder Vorgaben (bestimmte Engine, Programmiersprache)?
- Wer pflegt das Spiel später? Wie viel davon will Bernhard selbst verstehen und ändern können?
- Gibt es ein GitHub-Konto für das Repository?

**Umfang und Zeit**
- Gibt es einen Termin (Tag der offenen Tür, Schulschluss, eine Präsentation)?
- Was ist das kleinste Spiel, das schon Freude macht?

## 8. Technische Ausgangsempfehlung (als Vorschlag, nicht entschieden)

Für ein Spiel, das ohne Installation auf Schulgeräten laufen soll, liegt ein Browserspiel nahe: Three.js mit Vite und TypeScript, Physik und Kollision mit Rapier, gehostet als statische Seite (GitHub Pages reicht). Das GLB-Modell lädt Three.js direkt. Das Gelände entsteht als Heightmap mit einem Orthofoto als Textur; die Innenräume werden aus den Grundrissen extrudiert (Wände als Boxen, Böden und Decken als Platten), Fotos kommen als Texturen oder als Bild-Hotspots dazu.

Die Alternative ist Godot 4 mit Web-Export: mehr fertige Spiel-Werkzeuge (Szeneneditor, Dialoge), dafür ein größerer Download und Bernhard bräuchte den Editor. Unity WebGL ist für dieses Projekt zu schwer.

Entscheiden soll das Interview in Phase 1, vor allem die Fragen nach Geräten, Pflege und Optik.

## 9. Zur Zusammenarbeit mit Bernhard

Kommunikation auf Deutsch. Im Deutschen immer mit Doppelpunkt gendern (Schüler:innen, Lehrer:innen). Direkt und konkret schreiben, Empfehlungen aussprechen statt Optionen endlos aufzulisten, und sagen, wenn etwas nicht geht oder unklar ist.
