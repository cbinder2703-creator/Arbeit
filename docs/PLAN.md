# AzubiQuest – Bauplan

Ziel: Für **jede Prüfung ein eigenes Lernspiel** – am PC und am Handy, unter einer eigenen Domain.
Die erste Prüfung ist „Berufsbildung und Arbeitswelt“ (Kapitel 1–4) als Spiel **„Azubi-Akademie“**.
Weitere Prüfungen kommen als neue Ordner dazu und erscheinen automatisch als neue Spiele.

Grafiken in `docs/grafiken/` (PNG zum Ansehen in `png/`):

| Datei | Inhalt |
|---|---|
| `01-architektur.svg` | Plattform → Prüfungs-Spiele → Spielmodi → Engine → Hosting |
| `02-spielablauf.svg` | Vom Prüfungs-Spiel über die Runde bis zur Abschlussprüfung, Leitner-Boxen |
| `03-mockup-mobil.svg` | Handy: Meine Prüfungen, Prüfungs-Spiel, Quiz-Blitz, Kündigungs-Gericht, Sortier-Meister |
| `04-mockup-desktop.svg` | PC: Prüfungs-Spiel „Azubi-Akademie“ mit Sidebar |
| `05-roadmap.svg` | Phasen 1–5 |
| `06-designsystem.svg` | Farben, Schriften, Komponenten |

---

## Phase 1 – Fundament

1. Vite + React + TS + Tailwind, Ordnerstruktur aus `CLAUDE.md`.
2. zod-Schema für `pruefung.json`, Kapitel und alle Item-Typen (Tabelle unten) + `npm run validate-content`.
3. Loader: findet alle Prüfungen per `import.meta.glob('/content/pruefungen/*/pruefung.json')` und lädt ihre Kapitel.
4. Routing laut `CLAUDE.md`. Zwei Layouts:
   - **Plattform-Layout** („Meine Prüfungen“, Profil) – neutral.
   - **Prüfungs-Layout** – setzt Farben/Thema aus `pruefung.json` als CSS-Variablen, eigener Kopfbereich mit Spielname, Zurück-Pfeil zu „Meine Prüfungen“.
5. Navigation: mobil Bottom-Nav (im Prüfungs-Spiel: Start · Spielmodi · Karten · Prüfung), ab 1024 px Sidebar.
6. Seite **Meine Prüfungen**: eine große Spiel-Kachel je Prüfung (Spielname, Prüfung, Countdown, Fortschritt, beste Note) + Kachel „Neue Prüfung kommt bald“.
7. **Startseite des Prüfungs-Spiels**: XP/Level dieser Prüfung, „Heute dran“, Kapitelkarten, Spielmodi, Abschlussprüfung (gesperrt/frei).
8. Stores: `progress: Record<pruefungId, { xp, level, streak, leitner: Record<itemId, box+datum>, bestScores, badges, bestGrade }>`, `settings`.

**Fertig, wenn:** „Azubi-Akademie“ erscheint als Kachel; eine zweite Test-Prüfung (Kopie mit anderer Farbe, nicht committen) erscheint ohne Code-Änderung als zweites Spiel mit eigenem Fortschritt.

## Phase 2 – Engine + erste 3 Spielmodi (MVP)

**Engine (`src/engine/`, alles mit `pruefungId`)**
- `createSession(pruefungId, modusId, filter)` → fällige Leitner-Items + neue, Optionen gemischt.
- Punkte: richtig 100, Zeitbonus bis +50 (nur Quiz-Blitz), Combo ×1,5 ab 3 richtigen in Folge.
- XP = Punkte / 10, getrennt pro Prüfung. Level n braucht `100 · n^1.4` XP.
- Leitner: 5 Boxen, richtig → +1, falsch → Box 1, fällig nach 0 / 1 / 3 / 7 / 14 Tagen.
- Streak pro Prüfung + globaler Tages-Streak.
- Ergebnisbildschirm: Sterne, Punkte, XP-Balken, falsche Antworten mit Erklärung, „Nochmal“ / „Fehler üben“.

**Modi** (Details in `SPIELMODI.md`): Quiz-Blitz · Wahr oder Falsch? · Sortier-Meister

**Fertig, wenn:** Alle drei Modi pro Kapitel und „Alle Kapitel“ spielbar, Fortschritt bleibt nach Neuladen, Engine-Tests grün.

## Phase 3 – Weitere Spielmodi

Kündigungs-Gericht · Vertrags-Detektiv · Memory · Lückentext · Zeitstrahl · Lernkarten

**Fertig, wenn:** Jeder Item-Typ hat mindestens einen Modus.

## Phase 4 – Abschlussprüfung, Feinschliff, Veröffentlichung

- **Abschlussprüfung pro Prüfungs-Spiel** (Endgegner): Note nach IHK-Schlüssel
  100–92 % = 1 · 91–81 = 2 · 80–67 = 3 · 66–50 = 4 · 49–30 = 5 · 29–0 = 6
- Modus „Höher oder tiefer?“ (nutzt `charts`).
- Abzeichen aus `pruefung.json`, Konfetti bei „Bestanden!“.
- Prüfungstermin: Countdown auf der Kachel + Hinweis „Noch X Tage – heute Y Aufgaben üben“.
- Profil: Gesamt-XP, alle Prüfungen mit bester Note.
- PWA, Impressum, Datenschutz, Lighthouse mobil ≥ 90, Deployment → `DEPLOYMENT.md`.

## Phase 5 – Später

- Weitere Prüfungen als neue Spiele (`NEUE-PRUEFUNG.md`).
- Konten + Rangliste pro Prüfung + Klassen-Code (Supabase).
- Weitere Spielmodi (`NEUER-SPIELMODUS.md`): „Wer wird Azubionär“, Duell zu zweit, Tages-Challenge, Kreuzworträtsel.

---

## Content-Schema (für zod)

**Prüfung** (`pruefung.json`): Felder siehe `CLAUDE.md`.

**Kapitel**: `id`, `chapter`, `title`, `subtitle`, `pages`, `color`, `icon`, `flashcards[{id,term,definition}]`, `items[]`, optional `charts`, `contractChecklist`.

**Items** – gemeinsam: `id` (eindeutig innerhalb der Prüfung), `type`, `difficulty` (1–3), optional `source`, `explanation`, `law`.

| type | Felder | Spielmodus |
|---|---|---|
| `mc` | `question`, `options[]`, `correct` (Index) | Quiz-Blitz |
| `truefalse` | `statement`, `correct` (bool) | Swipe, Quiz-Blitz |
| `sort` | `question`, `categories[{id,label}]`, `cards[{text,category}]` | Sortier-Meister |
| `pairs` | `question`, `pairs[{left,right}]` | Memory |
| `order` | `question`, `steps[]` (richtige Reihenfolge) | Zeitstrahl |
| `case` | `title`, `situation`, `question`, `options[]`, `correct`, `law?` | Kündigungs-Gericht |
| `spot` | `title`, `intro`, `lines[{text,error,fix?}]` | Vertrags-Detektiv |
| `cloze` | `text` mit `{{Antwort}}`, `distractors[]` | Lückentext |

Erste Prüfung „Berufsbildung und Arbeitswelt“: **164 Aufgaben + 71 Lernkarten** in 4 Kapiteln.

---

## Prompts zum Kopieren (eine Phase pro Sitzung)

> Lies CLAUDE.md und docs/PLAN.md. Schau dir die Grafiken in docs/grafiken/png an. Setze Phase 1 komplett um und zeig mir am Ende, wie ich die App lokal starte.

> Setze Phase 2 aus docs/PLAN.md um. Halte dich bei den Modi genau an docs/SPIELMODI.md und an die Mockups.

> Setze Phase 3 um.

> Setze Phase 4 um und führe mich danach Schritt für Schritt durch docs/DEPLOYMENT.md.

**Neue Prüfung (= neues Spiel):**
> Lies docs/NEUE-PRUEFUNG.md und lege aus den Fotos in vorlagen/<id>/ eine neue Prüfung an. Spielname: „…“.

**Neuer Spielmodus:**
> Lies docs/NEUER-SPIELMODUS.md und baue einen neuen Modus: [Idee].
