# Aufgaben anlegen

Jede Zeile der Tabelle `game/public/daten/aufgaben.csv` ist eine Station im Spiel. Bearbeiten geht mit Excel, LibreOffice oder Google Sheets (als CSV speichern, Trennzeichen Komma, Kodierung UTF-8).

## Spalten

| Spalte | Pflicht | Inhalt |
|---|---|---|
| `id` | ja | eindeutig, z. B. `en-6b-u3-01` |
| `paket` | ja | Paketname(n), mehrere mit Komma: `6b-englisch-unit3, demo` |
| `fach` | ja | erscheint auf der Station; ein Abzeichen pro Fach |
| `sprache` | nein | `de`, `en`, `fr` … (nur zur Ordnung) |
| `typ` | ja | siehe unten |
| `ort` | nein | Stationsplatz (siehe unten); leer = automatisch |
| `figur` | nein | erfundene Figur, die die Aufgabe stellt; dann steht dort eine Person statt eines Pults |
| `frage` | ja | Aufgabentext |
| `antworten` | je nach Typ | Einträge mit `|` getrennt |
| `richtig` | je nach Typ | richtige Lösung(en), mit `|` getrennt |
| `medien` | nein | Dateiname in `public/medien/` (jpg, png, mp3, wav, mp4) |
| `hinweis` | nein | Tipp nach einem Fehlversuch |
| `punkte` | nein | Punkte im ersten Versuch (Standard 10; 2. Versuch: halb, danach ein Viertel) |
| `quelle` | nein | Quelle und Lizenz von Text und Medien |

## Aufgabentypen

| `typ` | `antworten` | `richtig` | Beispiel |
|---|---|---|---|
| `multiple_choice` | alle Optionen | die richtige(n); mehrere = Mehrfachauswahl | `Paris|Rom|Wien` → `Wien` |
| `wahr_falsch` | leer | `wahr` oder `falsch` | |
| `lueckentext` | leer = Eingabefeld, sonst Auswahlliste | pro Lücke eine Lösung, Alternativen mit `/` | Frage: `She ___ (go) home.` → `goes` |
| `zuordnen` | Paare `links = rechts` | leer | `Hund = dog|Katze = cat` |
| `reihenfolge` | Einträge in der **richtigen** Reihenfolge (das Spiel mischt) | leer | `Zelle|Gewebe|Organ` |
| `zahl` | leer | Zahl, optional mit Toleranz | `22±1` oder `3,14` |
| `bild_klick` | leer | `x,y,r` in Prozent (Mittelpunkt und Radius) | `medien`: `karte.png`, `richtig`: `62,40,8` |
| `dialog` | leer | leer | `frage` = Name des Dialogs in `dialoge.csv` |

Lücken im Lückentext schreibt man mit drei Unterstrichen `___`. Groß- und Kleinschreibung und doppelte Leerzeichen sind egal.

## Dialoge (`dialoge.csv`)

Eine Zeile pro Gesprächsschritt:

| Spalte | Inhalt |
|---|---|
| `dialog` | Name, wie in der Aufgabe unter `frage` |
| `schritt` | Nummer oder Name des Schritts; der erste Schritt beginnt |
| `sprecher` | Name der Figur |
| `text` | was die Figur sagt |
| `optionen` | Antworten mit `|` getrennt; die richtige mit `*` am Anfang und `>nächster Schritt` am Ende: `*Gern!>2|Nein.` |
| `hinweis` | Tipp nach einer falschen Wahl |

Ein Schritt ohne Optionen beendet den Dialog: Die Aufgabe ist gelöst.

## Stationsplätze im Prototyp

`vorplatz-1`, `vorplatz-2`, `vorplatz-3`, `aula-1` bis `aula-5`. Mit jedem neuen Gebäudeteil kommen weitere dazu.

## Paket an eine Klasse geben

Link: `https://<adresse-des-spiels>/?paket=6b-englisch-unit3`. Im Spiel erscheinen nur die Aufgaben dieses Pakets. Abschlusscodes prüft man unter `…/pruefung.html`.

## Rechte

Das Spiel ist öffentlich. Nur eigene oder frei lizenzierte Texte, Bilder, Audios und Videos verwenden; keine Scans oder Hörtexte aus Schulbüchern. Keine Fotos von erkennbaren Personen.
