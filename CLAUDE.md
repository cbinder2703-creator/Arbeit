# AzubiQuest – Projektanweisungen für Claude Code

Du baust **AzubiQuest**: eine Lern-Web-App für Berufsschüler. Sie läuft im Browser auf
**PC und Handy**, ist als App installierbar (PWA) und wird unter einer **eigenen Domain** veröffentlicht.

## Das wichtigste Prinzip: Jede Prüfung ist ein eigenes Spiel

```
AzubiQuest (Plattform)
 ├─ Prüfungs-Spiel „Azubi-Akademie“      ← Prüfung: Berufsbildung und Arbeitswelt
 │    ├─ eigene Startseite, eigenes Design-Thema, eigener Fortschritt (XP, Level, Abzeichen)
 │    ├─ Kapitel 1–4
 │    ├─ Spielmodi: Quiz-Blitz, Sortier-Meister, Kündigungs-Gericht, Memory …
 │    └─ Abschlussprüfung mit Note (Endgegner dieses Spiels)
 ├─ Prüfungs-Spiel #2                     ← nächste Prüfung (später)
 └─ Prüfungs-Spiel #3 …
```

- Die Startseite von AzubiQuest zeigt **„Meine Prüfungen“**: jede Prüfung als eigene Spiel-Kachel
  (Titel, Fach, Countdown bis zum Prüfungstermin, Fortschritt).
- Antippen öffnet das **Prüfungs-Spiel**: eine eigene Welt mit eigener Startseite, eigenem
  Farbthema, eigenen Kapiteln, Spielmodi, Abzeichen und eigener Abschlussprüfung.
- Fortschritt wird **pro Prüfung** getrennt gespeichert. Das Profil zeigt zusätzlich eine Gesamtübersicht.
- **Neue Prüfung = neuer Ordner** in `content/pruefungen/<id>/` → erscheint automatisch als neues Spiel.
  Anleitung: `docs/NEUE-PRUEFUNG.md`.
- Die **Spielmodi** (Quiz-Blitz, Memory …) sind wiederverwendbare Plugins in `src/modes/`. Jede
  Prüfung nutzt automatisch alle Modi, für die sie passende Inhalte hat. Neue Modi:
  `docs/NEUER-SPIELMODUS.md`.

Lies vor dem Start:
1. `docs/PLAN.md` – Phasen, Reihenfolge, Abnahmekriterien
2. `docs/SPIELMODI.md` – Regeln und Bedienung jedes Spielmodus
3. `docs/grafiken/png/*.png` (ansehen) bzw. `*.svg` (exakte Werte) – Mockups, Architektur, Spielablauf
4. `content/pruefungen/*/` – ALLE Lerninhalte (aus dem Schulbuch übertragen)

---

## Goldene Regeln

1. **Inhalte nur aus `content/`.** Keine Fakten erfinden, keine Zahlen „aktualisieren“.
   Die Schüler werden nach den Buchwerten geprüft (z. B. Mindestvergütung 682 € laut Buch).
   Fehlt etwas, schreib es in `docs/OFFENE-FRAGEN.md` statt es zu raten.
2. **Kein Code ist prüfungsspezifisch.** Alles, was eine Prüfung ausmacht (Titel, Farben, Thema,
   Kapitel, Abzeichen, Termin), steht in ihrer `pruefung.json`. Eine neue Prüfung darf keine
   Code-Änderung erfordern.
3. **Spielmodi sind Plugins.** Jeder Modus liegt in `src/modes/<modus-id>/` und registriert sich selbst.
   Kein Modus importiert Code eines anderen. Gemeinsames gehört in `src/engine/` oder `src/ui/`.
4. **Mobile first.** Jede Ansicht muss bei 360 px Breite perfekt bedienbar sein,
   Touch-Ziele mind. 44 × 44 px. Drag & Drop auch per Antippen (Karte antippen → Ziel antippen).
   Auf dem PC zusätzlich Tastatur (1–4, ←/→, Enter).
5. **Antwortoptionen immer mischen.** In den JSON-Dateien steht die richtige Antwort oft an
   Position 1 – zur Laufzeit Optionen, Karten und Paare mischen und `correct` umrechnen.
6. **Nach jeder Antwort sofort Feedback** (richtig/falsch + `explanation`, bei Fällen auch `law`).
   Ausnahme: die Abschlussprüfung (Feedback erst am Ende).
7. **Kein Backend in Phase 1–4.** Fortschritt in `localStorage` (Zustand `persist`), getrennt nach
   Prüfungs-ID. Keine Tracker, keine externen CDNs (DSGVO) – Schriften lokal über `@fontsource`.
8. **Deutsch** in der gesamten Oberfläche, Du-Ansprache, kurz und motivierend.
9. Nach jeder Phase: `npm run build`, `npm run test`, `npm run validate-content` müssen grün sein.

---

## Tech-Stack (fest)

| Bereich | Wahl |
|---|---|
| Build | Vite + React 18 + TypeScript (strict) |
| Styling | Tailwind CSS, Design-Tokens in `src/ui/theme.ts`, Prüfungs-Thema per CSS-Variablen |
| Animation | Framer Motion |
| Drag & Drop | @dnd-kit/core (Touch + Maus + Tastatur) |
| State | Zustand mit `persist` (localStorage) |
| Routing | React Router |
| Validierung | zod (Content-Schema) |
| PWA | vite-plugin-pwa (offline spielbar, installierbar) |
| Icons | lucide-react |
| Sound | kleine eigene Effekte (WebAudio), stummschaltbar |
| Tests | Vitest + Testing Library |
| Hosting | Cloudflare Pages oder Vercel (statisch) + eigene Domain |

## Routen

| Pfad | Seite |
|---|---|
| `/` | Meine Prüfungen (alle Prüfungs-Spiele als Kacheln) |
| `/p/:pruefungId` | Startseite des Prüfungs-Spiels (Kapitel, „Heute dran“, Modi, Abschlussprüfung) |
| `/p/:pruefungId/spiel/:modusId?kapitel=k2` | Eine Runde in einem Spielmodus |
| `/p/:pruefungId/abschluss` | Abschlussprüfung dieser Prüfung |
| `/p/:pruefungId/karten` | Lernkarten dieser Prüfung |
| `/profil` | Gesamtprofil über alle Prüfungen |
| `/impressum`, `/datenschutz` | Rechtliches |

## Ordnerstruktur (Ziel)

```
content/
  pruefungen/
    berufsbildung-arbeitswelt/      ← EINE Prüfung = EIN Spiel
      pruefung.json                 ← Titel, Spielname, Thema, Farben, Termin, Kapitel, Abzeichen
      k1-duales-system.json
      k2-ausbildungsvertrag.json
      k3-lebenslanges-lernen.json
      k4-arbeitsleistung.json
    <naechste-pruefung>/            ← einfach Ordner hinzufügen
src/
  app/            ← Routing, Layouts (Plattform-Layout + Prüfungs-Layout mit Thema)
  engine/         ← Session, Punkte, XP, Leitner, Mischen, Noten – alles mit pruefungId
  content/        ← zod-Schema, Loader (import.meta.glob über content/pruefungen/*/pruefung.json)
  modes/
    registry.ts   ← sammelt alle Modi per import.meta.glob
    quiz-blitz/
    wahr-falsch-swipe/
    sortier-meister/
    …             ← neuer Modus = neuer Ordner
  pages/          ← MeinePruefungen, PruefungStart, Runde, Abschluss, Lernkarten, Profil, Impressum
  ui/             ← Buttons, Cards, ProgressRing, Feedback-Sheet, Confetti, PruefungsKachel
  store/          ← progress (Record<pruefungId, PruefungsFortschritt>), settings
scripts/validate-content.ts
```

## `pruefung.json` (Felder)

| Feld | Bedeutung |
|---|---|
| `id` | Ordnername, wird in URLs und im Speicher benutzt |
| `title` | Name der Prüfung, z. B. „Berufsbildung und Arbeitswelt“ |
| `gameTitle` | Name des Spiels, z. B. „Azubi-Akademie“ (groß auf Kachel und Startseite) |
| `tagline`, `subject`, `pages` | Untertitel, Fach, Buchseiten |
| `examDate` | `"2026-12-03"` oder `null` → Countdown + Lernplan-Hinweis |
| `color`, `accent`, `icon`, `theme` | Aussehen des Spiels (Thema setzt CSS-Variablen + Hintergrundmuster) |
| `chapters` | Kapiteldateien in Reihenfolge |
| `modes` | `"auto"` (alle passenden Modi) oder Liste von Modus-IDs |
| `finalExam` | Titel, Anzahl Aufgaben, Freischalt-Schwelle in % |
| `badges` | Abzeichen dieser Prüfung (Regeln werden von der Engine ausgewertet) |

## Spielmodus-Plugin-Schnittstelle

```ts
// src/modes/types.ts
export type ItemType = 'mc' | 'truefalse' | 'sort' | 'pairs' | 'order' | 'case' | 'spot' | 'cloze';

export interface GameMode {
  id: string;                 // 'quiz-blitz'
  title: string;              // 'Quiz-Blitz'
  tagline: string;
  icon: string;               // lucide-Name
  color: string;
  accepts: ItemType[];
  usesFlashcards?: boolean;
  usesCharts?: boolean;
  minItems: number;
  sessionSize: number;
  Component: React.LazyExoticComponent<React.FC<ModeProps>>;
}

export interface ModeProps {
  pruefung: PruefungMeta;     // für Thema/Farben
  items: ContentItem[];       // gefiltert + gemischt von der Engine
  flashcards?: Flashcard[];
  charts?: Charts;
  onAnswer: (r: { itemId: string; correct: boolean; timeMs: number }) => void;
  onFinish: (s: { score: number; maxScore: number }) => void;
}
```

Die Engine (nicht der Modus) vergibt XP, führt Leitner-Boxen, Streaks und Abzeichen –
immer unter der jeweiligen `pruefungId`. Ein Modus kümmert sich nur um Darstellung und Regeln.

## Design

Vorlage: `docs/grafiken/`. Kurz:
- Plattform-Ebene („Meine Prüfungen“) neutral dunkel (`#0B1020`, Karten `#151B2E`).
- Im Prüfungs-Spiel übernimmt das Thema aus `pruefung.json` Akzentfarbe, Kopfbereich und Muster –
  so fühlt sich jede Prüfung wie ein eigenes Spiel an.
- Kapitelfarben aus den Kapitel-JSONs (K1 Blau, K2 Orange, K3 Grün, K4 Lila).
- Schrift: Nunito (Überschriften, 800), Inter (Text). Radius 16–24 px, Animationen < 300 ms.
- Richtig = Grün `#22C55E` + „Pling“, Falsch = Rot `#EF4444` + Wackeln. `prefers-reduced-motion` beachten.
