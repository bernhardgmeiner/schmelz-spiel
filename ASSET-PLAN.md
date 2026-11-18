# Asset-Plan: Schmelz-Spiel

Stand: 18. November 2026 · Entwurf 1, zur Freigabe durch Bernhard
Grundlage: GAME-DESIGN.md (freigegeben)

Dieser Plan sagt, was du lieferst, in welcher Form und in welcher Reihenfolge. Was aus offenen Daten kommt, besorge ich selbst.

## 1. Kurzfassung: was zuerst

**Paket A, für den Prototyp** (Eingang, Vorplatz, Aula):

| # | Was | Menge |
|---|---|---|
| A1 | Fluchtwegplan Erdgeschoss | 1 Foto |
| A2 | Zwei gemessene Maße im EG + Raumhöhe der Aula | 3 Zahlen |
| A3 | Fotos Haupteingang und Vorplatz bis zur Straße | ca. 15 Fotos |
| A4 | Fotos Eingangshalle/Aula innen | ca. 15 bis 20 Fotos |
| A5 | 3 bis 5 Beispielaufgaben Englisch/GWB, davon 1 mit Audio | Tabelle + Medien |
| A6 | Okay der Direktion (siehe Abschnitt 8) | 1 Gespräch |

**Paket B, für den Ausbau** (später, Geschoss für Geschoss): Fluchtwegpläne aller Geschosse, Fotos aller Fassaden und des Schulhofs, Fotos der Gänge und besonderen Räume, Raumliste.

Du musst also **nicht alles auf einmal** fotografieren. Paket A reicht für den Prototyp.

## 2. Wohin mit den Dateien

Lege einen Ordner `assets-roh/` in den Projektordner (`Documents\schmelz_game\assets-roh\`) und darin diese Struktur:

```
assets-roh/
├── plaene/          Fluchtwegpläne
├── aussen/          Fotos außen
├── innen/
│   ├── eg/          Erdgeschoss, Unterordner pro Raum (z. B. aula/)
│   ├── og1/         1. Obergeschoss usw.
│   └── ug/          falls es ein Untergeschoss gibt
├── aufgaben/        Bilder, Audio, Video für Aufgaben
└── notizen.txt      Maße, Raumhöhen, Anmerkungen (einfach drauflosschreiben)
```

Dieser Ordner kommt **nicht** ins öffentliche Repository. Ich bereite daraus verkleinerte, geprüfte Versionen auf. Nur die kommen ins Spiel.

Dateinamen müssen nicht perfekt sein. Wichtig sind der richtige Ordner und ein Hinweis in `notizen.txt`, wenn etwas unklar ist. Wenn du magst, halte dich an dieses Muster: `ort_richtung_nummer.jpg`, also z. B. `haupteingang_frontal_01.jpg` oder `aula_richtung-eingang_03.jpg`.

## 3. Fluchtwegpläne (A1, später B)

- **Ein Foto pro Geschoss**, auch Keller und Dachgeschoss, wenn begehbar.
- Möglichst **gerade von vorne**, der ganze Plan im Bild, Ecken sichtbar. Ohne Blitz (spiegelt hinter Glas), lieber leicht schräg stehen, damit dich die Scheibe nicht spiegelt.
- Volle Handy-Auflösung, JPG, nicht bearbeiten.
- Wenn die Direktion oder die Schulwartin/der Schulwart die Pläne als **PDF** hat: noch besser, dann das PDF.
- Name: `plan_eg.jpg`, `plan_og1.jpg`, `plan_og2.jpg`, `plan_ug.jpg`.

### Maße (A2)

Pläne haben selten einen brauchbaren Maßstab. Damit ich alles richtig skalieren kann, brauche ich **zwei echte Maße** im Erdgeschoss, möglichst weit auseinander und rechtwinklig zueinander. Zum Beispiel die Länge der Aula und die Breite des Hauptgangs. Maßband oder Laser-Entfernungsmesser; zur Not Schritte zählen und dazuschreiben „geschätzt“.

Dazu **Raumhöhen**: Aula, ein normales Klassenzimmer, ein Gang, später der Turnsaal. Eintragen in `notizen.txt`.

## 4. Fotos außen (A3, später B)

Allgemein:
- Handy, Querformat, volle Auflösung, JPG. Keine Filter, kein Porträtmodus, kein Weitwinkel-„0,5×“ (verzerrt die Linien).
- **Bedeckter Himmel oder Vormittag ohne harte Schatten** ist ideal.
- Lieber zu viele Fotos als zu wenige. Überlappung ist gut.

**Für den Prototyp (A3):**
1. Haupteingang frontal, aus 5, 15 und 30 Metern.
2. Haupteingang schräg von links und von rechts (ca. 45°).
3. Tür im Detail: Rahmen, Griff, Stufen oder Rampe, Vordach.
4. Vom Eingang aus zur Straße hin (was sieht man, wenn man rauskommt).
5. Vorplatz: Boden (Pflaster, Asphalt, Wiese), Bänke, Fahrradständer, Zaun, Tor, Bäume, Laternen, Schilder (ohne Namen von Personen).
6. Die Straße und die gegenüberliegende Seite, ein bis zwei Fotos.

**Später (B):**
- Jede Fassade frontal und schräg, auch Turnsaal-Trakt und Innenhöfe.
- Schulhof mit allem, was dort steht.
- Den Bereich zwischen Turnsaal-Trakt und Hauptbau (im Modell ist dort ein schmaler Gang mit offenen Flächen daneben; ich will wissen, was dort wirklich ist).
- Ein Foto vom Dach oder aus einem oberen Fenster auf den Hof, falls möglich.

## 5. Fotos innen (A4, später B)

Pro Raum gilt dasselbe Muster, das ich „vier Ecken plus Details“ nenne:

1. **Aus jeder Ecke einmal quer durch den Raum** fotografieren (4 Fotos). Daraus kann ich den Raum rekonstruieren.
2. **Jede Wand einmal frontal** (4 Fotos).
3. **Boden und Decke** je ein Foto (Material, Lampen).
4. **Details:** Türen, Fenster, typische Möbel, Treppengeländer, Garderoben, Vitrinen, Schaukästen, Infoscreens.

Für die **Aula (A4)** zusätzlich: der Blick vom Haupteingang hinein (das ist der erste Eindruck im Spiel) und alle Ausgänge in andere Gänge.

**Später (B):** Gänge in jedem Geschoss (alle 10 bis 15 m ein Foto in Gangrichtung), Stiegenhäuser, Glasdach-Halle, Turnsaal, Bibliothek, Fachsäle, ein typisches Klassenzimmer. Normale Klassenzimmer baue ich aus **einem** Vorbild nach und verwende es mehrfach.

**Raumliste (B):** eine einfache Liste in `notizen.txt` mit Raumnummer und Funktion pro Geschoss (z. B. „E.12 Physiksaal“), soweit sie nicht auf dem Fluchtwegplan steht.

## 6. Datenschutz und Rechte bei Fotos

Bitte vor dem Ablegen jedes Foto kurz prüfen:

- **Keine erkennbaren Personen**, vor allem keine Schüler:innen. Am besten in den Ferien, am Nachmittag oder am Wochenende fotografieren.
- **Keine Namen** auf Türschildern, Postfächern, Garderoben, Stundenplänen, Vertretungsplänen, Aushängen, Arbeiten an Pinnwänden.
- **Keine Kennzeichen** von Autos und keine Fenster von Nachbarwohnungen im Detail.
- **Keine Sicherheitsdetails** wie Schlüsselkästen, Alarmanlagen-Bedienteile, Zugangscodes, Serverraum.

Wenn auf einem sonst guten Foto doch etwas drauf ist: trotzdem ablegen und in `notizen.txt` vermerken. Ich mache es unkenntlich oder baue die Stelle ohnehin in Low-Poly nach, ohne das Foto direkt zu zeigen.

## 7. Medien für Aufgaben (A5)

| Art | Format | Grenze | Hinweis |
|---|---|---|---|
| Bild | JPG oder PNG | lange Kante max. 2000 px | Karten, Diagramme, Fotos |
| Audio | MP3 | max. 3 Minuten, max. 5 MB | Hörverstehen; eigene Aufnahme oder frei lizenziert |
| Video | MP4 (H.264) | max. 1 Minute, 720p, max. 20 MB | eigene Clips; kein YouTube |

Größere Dateien sind möglich, machen das Spiel auf Handys aber langsam.

**Rechte:** Nur eigene Medien, Medien mit freier Lizenz (z. B. CC BY, CC0) oder solche, für die die Schule eine Erlaubnis zur **öffentlichen** Nutzung hat. Lehrbuch-Audios und Scans aus Schulbüchern dürfen nicht hinein, weil das Spiel öffentlich im Netz steht. Quelle und Lizenz kommen in eine eigene Spalte der Aufgabentabelle.

**Für den Prototyp** schreibe ich drei bis fünf Beispielaufgaben selbst vor (Englisch und GWB), du korrigierst sie. Von dir brauche ich dafür nur **eine kurze Audioaufnahme** (30 bis 60 Sekunden Englisch, z. B. eine Durchsage oder ein kurzer Dialog). Notfalls nehme ich eine synthetische Stimme als Platzhalter.

## 8. Vorab mit der Direktion klären (A6)

Das Spiel liegt öffentlich im Netz. Wer es spielt, kann sich durch das ganze Gebäude bewegen, und der Code (inklusive Grundrisse) ist auf GitHub einsehbar. Das ist nicht geheim, Fluchtwegpläne hängen ohnehin öffentlich aus. Trotzdem sollte die Direktion vorher **Ja** sagen, bevor ein vollständiger Innenplan der Schule online geht. Ein kurzes Gespräch mit dem Hinweis auf Abschnitt 6 reicht.

Falls die Direktion bestimmte Bereiche nicht im Spiel haben will (z. B. Verwaltung, Konferenzzimmer, Technikräume), werden die einfach verschlossene Türen.

## 9. Offene Daten (besorge ich)

| Was | Quelle | Wofür | Lizenz laut Anbieter |
|---|---|---|---|
| Orthofoto (Luftbild) | Stadt Wien OGD bzw. basemap.at | Lageplan, Nordrichtung, Grundriss von Hof und Vorplatz | CC BY 4.0 (vor Verwendung prüfen) |
| Digitales Geländemodell | Stadt Wien OGD | Bodenhöhen rund um die Schule | CC BY 4.0 |
| Baukörpermodell | Stadt Wien OGD | Nachbarhäuser als einfache Blöcke | CC BY 4.0 |
| Straßen, Gehsteige | Orthofoto, ev. OpenStreetMap | Straßenraum bis zur Grundgrenze | ODbL bei OSM (Namensnennung) |

Das Luftbild dient nur als **Vorlage zum Nachbauen** im Low-Poly-Stil, es wird nicht als Textur ins Spiel gelegt. Namensnennung kommt trotzdem in die Credits, z. B. „Datenquelle: Stadt Wien – data.wien.gv.at“ und „basemap.at“.

Das alte Google-Earth-Bild aus der .skp-Datei wird nicht verwendet.

## 10. Was ich mit deinen Daten mache

1. Pläne entzerren und auf Meter skalieren, mit dem Orthofoto und dem 3D-Modell abgleichen (dabei klärt sich auch die Nordrichtung).
2. Wände, Türen und Böden aus dem Plan als Low-Poly-Geometrie erzeugen.
3. Farben und Materialien aus deinen Fotos abnehmen (Wandfarbe, Bodenbelag, Fensterrahmen) und als flache Farben setzen.
4. Ausgewählte Fotos als „Plakate“ oder in Aufgaben verwenden, verkleinert und geprüft.
5. Credits-Datei laufend nachführen.

## 11. Noch zu klären

- Wer hat die Fluchtwegpläne als PDF (Direktion, Schulwart:in, Bauamt der Stadt Wien)?
- Name der Person, die das 3D-Modell gebaut hat, und ob sie in den Credits stehen will.
- Gibt es schon frei nutzbare Fotos der Schule (Schulwebsite, Jahresbericht), bei denen die Rechte geklärt sind?
