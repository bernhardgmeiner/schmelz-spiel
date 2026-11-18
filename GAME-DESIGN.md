# Game-Design-Dokument: Schmelz-Spiel (Arbeitstitel)

Stand: 18. November 2026 · Entwurf 1, zur Freigabe durch Bernhard
Grundlage: Interview in Phase 1 (7 Runden) und HANDOFF.md

## 1. Spielidee in einem Satz

Eine frei begehbare 3D-Version des GRG 15 Auf der Schmelz, in der überall Stationen mit Aufgaben aus allen Fächern stehen. Lehrer:innen schreiben die Aufgaben selbst in eine Tabelle und schicken ihrer Klasse einen Link zu einem Aufgabenpaket.

Das Spiel ist damit weniger ein fertiges Abenteuer als eine **Lernlandschaft mit Aufgabenmaschine**: Die Schule ist die Welt, die Inhalte kommen von den Kolleg:innen.

## 2. Zielgruppe und Einsatz

| | |
|---|---|
| Spieler:innen | Oberstufe, 15 bis 18 Jahre |
| Fächer | alle; zuerst Englisch und GWB als Beispielinhalte |
| Spielsprache (Oberfläche) | Deutsch und Englisch, umschaltbar |
| Sprache der Aufgaben | jede Unterrichtssprache, so wie die Lehrkraft sie in die Tabelle schreibt |
| Einsatz | gemeinsam im Unterricht und frei im Netz (zu Hause) |
| Spieldauer | mehrere Stunden insgesamt, verteilt auf Sitzungen; Speicherstand im Browser |
| Spielmodus | Einzelspiel; die Klasse spielt parallel, jede:r für sich |

## 3. Spielablauf

1. **Start:** Die Schüler:in öffnet den Link der Lehrkraft, z. B. `…/?paket=6b-englisch-unit3`. Ohne Paket startet ein freies Spiel mit Demo-Stationen.
2. **Kurzer Einstieg:** Sprache wählen, Steuerung erklärt in drei Bildschirmen, Figur steht vor dem Haupteingang.
3. **Erkunden:** frei durch Gelände und Gebäude laufen. Stationen sind schon von weitem als leuchtende Markierung zu sehen. Eine Übersichtskarte (Taste M / Kartensymbol) zeigt, welche Stationen offen und welche gelöst sind.
4. **Station lösen:** hingehen, Aufgabe öffnet sich als Fenster über der Welt. Sofortiges Feedback (richtig / falsch / Hinweis). Pro Aufgabe sind mehrere Versuche erlaubt; weniger Versuche bringen mehr Punkte.
5. **Fortschritt:** Punkte und Abzeichen (z. B. pro Fach, pro Gebäudeteil, für alle Stationen eines Pakets). Alle Bereiche sind von Anfang an offen.
6. **Abschluss:** Wenn das Paket fertig ist (oder jederzeit auf Wunsch), zeigt das Spiel einen **Abschlusscode** mit Zusammenfassung. Die Schüler:in gibt ihn ab, z. B. als Screenshot oder Text in Teams.

## 4. Aufgaben

### 4.1 Aufgabentypen (alle automatisch prüfbar)

| Typ | Beispiel | Fach-Beispiele |
|---|---|---|
| Multiple Choice (eine oder mehrere richtig) | „Which statement is true according to the text?“ | alle |
| Lückentext (Eingabe oder Auswahl) | Verbformen, Fachbegriffe | Sprachen, Bio, Chemie |
| Zuordnen | Begriffe ↔ Definitionen, Länder ↔ Hauptstädte | alle |
| Reihenfolge | Ereignisse, Prozessschritte, Sätze eines Absatzes | Geschichte, Bio, Sprachen |
| Zahl | Rechenergebnis, Schätzung mit Toleranz | Mathe, Physik, GWB |
| Auf Bild/Karte klicken | Ort auf einer Karte, Teil einer Abbildung | GWB, Bio, Physik |
| Wahr/Falsch | schnelle Prüfungsfragen | alle |
| Dialog mit Figur | Gespräch mit Antwortauswahl, auch verzweigt | Sprachen, Ethik, Berufsorientierung |

Jede Aufgabe kann **Bild, Audio oder Video** enthalten (Lese- und Hörverstehen, Diagramme, Karten). Video als eigene Datei, nicht über YouTube (Datenschutz, Tracking).

Offene Antworten (Freitext) und KI-Bewertung gibt es bewusst nicht.

### 4.2 Die Aufgabentabelle

Kolleg:innen tragen Aufgaben in eine **Tabellenvorlage** ein (Google Sheet oder Excel), eine Zeile pro Aufgabe. Ein erster Entwurf der Spalten:

| Spalte | Bedeutung | Beispiel |
|---|---|---|
| `id` | eindeutige Kennung | `en-6b-u3-01` |
| `paket` | zu welchen Paketen die Aufgabe gehört (mehrere mit Komma) | `6b-englisch-unit3` |
| `fach` | Fach | Englisch |
| `sprache` | Sprache der Aufgabe | en |
| `typ` | Aufgabentyp aus 4.1 | multiple_choice |
| `ort` | Stationsplatz (leer = Spiel wählt einen freien) | `eg-aula-2` |
| `figur` | erfundene Figur, die die Aufgabe stellt (optional) | Frau Novak |
| `frage` | Aufgabentext | Read the notice. Where …? |
| `antworten` | Antwortmöglichkeiten, mit `|` getrennt | Gym | Library | Cafeteria |
| `richtig` | richtige Antwort(en) | Library |
| `medien` | Dateiname von Bild, Audio, Video | `notice-library.jpg` |
| `hinweis` | Tipp nach einem Fehlversuch | Look at the second paragraph. |
| `punkte` | Punkte bei Lösung im ersten Versuch | 10 |

Verzweigte Dialoge passen schlecht in eine einzelne Zeile. Dafür gibt es ein eigenes Tabellenblatt „Dialoge“ (eine Zeile pro Gesprächsschritt). Die genaue Form lege ich im Prototyp fest.

**Empfehlung zur Anbindung:** Das Google Sheet wird „im Web veröffentlicht“ (als CSV), das Spiel lädt es beim Start. Dann sind Änderungen der Kolleg:innen sofort im Spiel, ohne dass jemand am Code etwas tun muss. Als Sicherung liegt eine Kopie im Repository. Im Sheet stehen nur Aufgaben, keine Daten über Schüler:innen.

### 4.3 Stationsplätze

Die Welt hat viele vorbereitete **Stationsplätze** mit festen Namen (`eg-aula-1`, `hof-nord-3`, `og1-gang-west-2` …). Eine Aufgabe kann einen Platz nennen; ohne Angabe verteilt das Spiel die Aufgaben eines Pakets auf freie Plätze. Damit sind Aufgaben an echte Orte gebunden, aber inhaltlich frei verteilt, so wie du es willst.

### 4.4 Abschlusscode

Der Code enthält Paket, gelöste Aufgaben, Punkte, Datum und eine Prüfsumme, die einfaches Fälschen erschwert (aber nicht unmöglich macht; für eine Übung reicht das). Dazu eine lesbare Zusammenfassung. Ob ein Name oder Kürzel hineinkommt, tippt die Schüler:in selbst ein; gespeichert wird er nur im eigenen Browser. Eine kleine Prüfseite für Lehrer:innen entschlüsselt die Codes.

## 5. Welt und Räume

- **Außengelände:** Schulgrundstück mit Schulhof und Vorplatz bis zur Straße samt Gehsteigen. Nachbarhäuser als einfache graue Blöcke im Hintergrund. Gelände und Grundriss nach Orthofoto (offene Daten).
- **Gebäude außen:** das vorhandene Modell als Basis, im Low-Poly-Stil nachgefärbt, Haupteingang und weitere Eingänge geöffnet.
- **Gebäude innen:** am Ende **das ganze Haus**, gebaut aus den Fluchtwegplänen: Wände hochgezogen, Türen ausgeschnitten, Räume mit Standardmöbeln (Tische, Tafel, Kästen) bestückt. Besondere Räume (Aula, Glasdach-Halle, Turnsaal, Bibliothek, Fachsäle) bekommen eigene Einrichtung und Fotos an den Wänden.
- **Ausbaustufen:** Prototyp (Aula) → Erdgeschoss → weitere Geschosse, eines nach dem anderen.
- **Stil:** stilisiert, Low-Poly, flache Farben, weiches Licht. Echte Fotos erscheinen als Bilder in Aufgaben und als „Plakate“ an Wänden, nicht als Fassadentextur. Tageszeit fix (heller Vormittag), kein Wetter.

## 6. Figuren

Nur **erfundene Figuren** (Lehrer:innen, Schüler:innen, Schulwart:in, Besucher:innen) mit Namen und einem einfachen Low-Poly-Aussehen. Kolleg:innen können sie in der Tabelle als Fragesteller:innen ihrer Aufgaben einsetzen. Keine echten Personen, keine Fotos von Personen.

Die eigene Spielfigur: einfache Low-Poly-Figur, ein paar Farb- und Frisur-Varianten zur Auswahl.

## 7. Steuerung und Plattform

- **Perspektive:** Schulterblick (Third Person), Kamera weicht Wänden aus.
- **Laptop/PC:** WASD oder Pfeiltasten zum Gehen, Maus zum Umsehen, E oder Klick zum Interagieren, M für die Karte.
- **Tablet/Handy:** virtueller Joystick links, Wischen rechts zum Umsehen, Tipp-Knopf zum Interagieren. Aufgaben-Fenster funktionieren im Hoch- und Querformat.
- **Leistung:** muss auf schwachen Schul-Laptops und älteren iPads flüssig laufen. Deshalb Low-Poly, wenige Lichter, Räume werden nur geladen, wenn man in der Nähe ist.
- **Ohne Installation** im Browser; Internet beim Start nötig (für das Aufgaben-Sheet).

## 8. Technik

| Bereich | Wahl |
|---|---|
| 3D | Three.js |
| Sprache, Build | TypeScript, Vite |
| Physik, Kollision | Rapier (eigene, vereinfachte Collider-Boxen) |
| Aufgaben | veröffentlichtes Google Sheet (CSV), Kopie im Repository |
| Medien | Ordner im Repository (Bilder, MP3, kurze MP4) |
| Speicherstand | lokal im Browser (localStorage), keine Konten, kein Server |
| Texte der Oberfläche | eine Sprachdatei pro Sprache (DE, EN) |
| Hosting | GitHub Pages, Repository auf Bernhards GitHub-Konto |

Bernhard pflegt Inhalte (Tabelle, Fotos, Pläne); Code-Änderungen machen wir gemeinsam. Datenschutz: Das Spiel sammelt keine Daten von Schüler:innen und setzt keine Tracker oder externen Schriftarten ein.

## 9. Umfang des ersten Prototyps (vertical slice)

1. Stück Außengelände vor dem Haupteingang bis zur Straße, das Gebäude im Low-Poly-Stil.
2. Begehbarer Haupteingang.
3. Eingangshalle/Aula innen, eingerichtet nach Plan und Fotos.
4. Drei bis fünf Stationen mit mindestens drei Aufgabentypen (Multiple Choice mit Bild, Lückentext, Hörverstehen mit Audio), dazu ein kurzer Dialog mit einer Figur.
5. Aufgaben aus einer Beispieltabelle, ein Paket per Link.
6. Punkte, ein Abzeichen, Speicherstand, Abschlusscode samt Prüfseite.
7. Oberfläche Deutsch/Englisch.
8. Steuerung mit Tastatur/Maus und Touch.
9. Online auf GitHub Pages.

Nicht im Prototyp: weitere Geschosse, Karte, Figurenauswahl, Video.

## 10. Offene Punkte

- **Nordrichtung und Lageplan:** gegen Orthofoto prüfen. Im Modell ist zwischen Turnsaal-Trakt und Hauptbau ein schmaler Gang mit offenen Flächen daneben; klären, was dort in Wirklichkeit ist.
- **Name im Abschlusscode:** ja oder nein? Mein Vorschlag: freiwilliges Kürzel.
- **Google Sheet oder Excel:** Google Sheet empfehle ich wegen der Live-Anbindung. Geht das an deiner Schule, oder ist Microsoft 365 Pflicht? (Dann: Excel-Vorlage und CSV-Export ins Repository.)
- **Ton:** Hintergrundgeräusche und Musik ja oder nein?
- **Barrierefreiheit:** Schriftgröße, Kontraste, Untertitel für Audio. Ich plane Grundlagen von Anfang an mit.
- **Credits:** Ersteller:in des 3D-Modells fragen, ob und wie genannt; Namensnennung für offene Geodaten.
- **Titel des Spiels.**
