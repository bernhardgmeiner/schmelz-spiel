# Schmelz-Spiel

3D-Lernspiel im GRG 15 Auf der Schmelz: frei begehbare Schule mit Stationen, deren Aufgaben Lehrer:innen selbst in eine Tabelle schreiben. Browserspiel (Three.js, TypeScript, Vite, Rapier), läuft auf PC, Tablet und Handy.

| Dokument | Inhalt |
|---|---|
| [GAME-DESIGN.md](GAME-DESIGN.md) | Spielidee, Ablauf, Aufgabentypen, Technik (freigegeben) |
| [ASSET-PLAN.md](ASSET-PLAN.md) | welche Fotos, Pläne und Daten in welcher Form (freigegeben) |
| [AUFGABEN-ANLEITUNG.md](AUFGABEN-ANLEITUNG.md) | wie man Aufgaben und Pakete anlegt |
| [HANDOFF.md](HANDOFF.md) | Ausgangslage und 3D-Modell |

## Stand: Prototyp 0.1 (18.11.2026)

Spielbar: Vorplatz mit Straße, geöffneter Haupteingang, Aula, 8 Beispielstationen (alle Aufgabentypen außer „Bild anklicken“ und ein Dialog), Punkte, Abzeichen, Speicherstand, Abschlusscode, Prüfseite, Deutsch/Englisch, Tastatur/Maus und Touch.

Platzhalter, bis Plan und Fotos da sind: Maße und Einrichtung der Aula, Vorplatz, Straße, Nachbarhäuser, Audioaufnahme (synthetische Stimme).

## Lokal starten

```
cd game
npm install
npm run dev
```

Dann <http://localhost:5173> öffnen. Ein bestimmtes Paket: `?paket=name`, ohne Angabe läuft `demo`. Codes prüfen: `pruefung.html`.

## Ordner

```
game/
  public/daten/aufgaben.csv     Aufgabentabelle
  public/daten/dialoge.csv      Dialoge
  public/daten/einstellungen.json  optional: Link zu einem Google Sheet
  public/medien/                Bilder, Audio, Video für Aufgaben
  public/modell/                3D-Modell des Gebäudes
  src/                          Spielcode
grg15-spiel-handoff/            Originalmodell, Texturen, Vorschaubilder
```

## Credits

3D-Modell „Grg15 Auf der Schmelz“ aus 3D Warehouse, Weiterverwendung mit Erlaubnis des Erstellers.
