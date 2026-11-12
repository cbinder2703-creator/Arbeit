# Spielmodi – Regeln und Bedienung

Jede Prüfung ist ein eigenes Spiel (siehe `CLAUDE.md`). Innerhalb eines Prüfungs-Spiels gibt es diese
**Spielmodi**. Sie werden automatisch angeboten, wenn die Prüfung passende Inhalte hat, und übernehmen
Farben und Thema der Prüfung.

Alle Modi: oben Fortschrittsbalken + Punkte + Schließen (×). Nach jeder Antwort erscheint
von unten ein **Feedback-Sheet** (grün/rot, Erklärung, bei Fällen der Paragraf) mit „Weiter“.
Auf dem PC zusätzlich Tastatur. Runde endet mit dem gemeinsamen Ergebnisbildschirm der Engine.

---

## 1. Quiz-Blitz ⚡  (`quiz-blitz`)
- **Typen:** `mc`, `truefalse` · **Runde:** 10 Fragen
- Frage oben, 2–4 große Antwortbuttons untereinander (mobil) bzw. 2 × 2 (Desktop).
- 20-Sekunden-Ring pro Frage (abschaltbar in Einstellungen → „Entspannt-Modus“).
- Zeitbonus bis +50, Combo ab 3 richtigen (Flammen-Symbol + ×1,5).
- Tasten: `1`–`4`, `Enter` = Weiter.

## 2. Wahr oder Falsch? 👆  (`wahr-falsch-swipe`)
- **Typen:** `truefalse` · **Runde:** 15 Karten
- Kartenstapel; nach rechts wischen = wahr (grün), nach links = falsch (rot). Buttons darunter als Alternative.
- Karte kippt beim Ziehen und färbt sich ein. 60-Sekunden-Gesamttimer im „Blitz-Modus“ (optional).
- Tasten: `←` falsch, `→` wahr.

## 3. Sortier-Meister 🗂️  (`sortier-meister`)
- **Typen:** `sort` · **Runde:** 1 Sortieraufgabe (alle Karten eines Items)
- Oben 2–4 Ablagefächer (Kategorien), unten Karten-Stapel – eine Karte nach der anderen.
- Ziehen per dnd-kit ODER Karte antippen → Fach antippen.
- Falsch einsortiert: Karte springt zurück + Hinweis, zählt als Fehler (−50).
- Beispiel: „Wessen Pflicht ist das? Betrieb vs. Azubi“ (14 Karten).

## 4. Kündigungs-Gericht ⚖️  (`kuendigungs-gericht`)
- **Typen:** `case` · **Runde:** 5 Fälle
- Gerichtssaal-Optik: Fallakte (Titel + Situation) als Papierkarte, darunter „Dein Urteil“ mit Antwortoptionen.
- Richtig: Hammer schlägt (Animation + Sound), Stempel „URTEIL BESTÄTIGT“. Falsch: Stempel „REVISION“.
- Danach Erklärung + Paragraf (`law`) als Badge.

## 5. Vertrags-Detektiv 🔍  (`vertrags-detektiv`)
- **Typen:** `spot` · **Runde:** 1 Vertrag
- Zeilen wie ein Formular. Spieler tippt alle fehlerhaften Zeilen an (Lupe-Markierung), dann „Prüfen“.
- Auswertung je Zeile: richtig erkannt / übersehen / fälschlich markiert, mit `fix`.
- Zusatz-Ansicht „Checkliste“: zeigt die 12 Mindestangaben (`contractChecklist`) zum Nachlesen.

## 6. Memory 🃏  (`memory`)
- **Typen:** `pairs` + `flashcards` (Begriff ↔ Definition) · **Runde:** 6 Paare (12 Karten)
- Karten umdrehen, Paare finden. Zähler für Züge, Bestzeit wird gespeichert.
- Mobil 3 × 4 Raster, Desktop 4 × 3. Text auf Karten automatisch verkleinern.

## 7. Lückentext ✍️  (`lueckentext`)
- **Typen:** `cloze`
- Text mit Lücken, darunter Wort-Chips (Lösungen + `distractors`, gemischt). Chip antippen → füllt nächste freie Lücke, Lücke antippen → Chip zurück.
- „Prüfen“ färbt jede Lücke.

## 8. Zeitstrahl 🧭  (`zeitstrahl`)
- **Typen:** `order`
- Schritte gemischt als Liste, per Ziehen (Griff ☰) oder Pfeiltasten ↑↓ sortieren, dann „Prüfen“.
- Richtige Positionen grün, falsche rot mit Pfeil zur richtigen Stelle.

## 9. Lernkarten 📇  (`lernkarten`)
- **Typen:** `flashcards`
- Karte zeigt Begriff, Tippen dreht um (3D-Flip) → Definition. Buttons „Wusste ich“ / „Nochmal“.
- Speist das Leitner-System. Kein Punktedruck – Lernmodus.

## 10. Höher oder tiefer? 📈  (`hoeher-tiefer`)
- **Typen:** `charts` aus Kapitel 4
- Zwei Karten nebeneinander, z. B. „Leistung um 10 Uhr“ vs. „Leistung um 14 Uhr“ oder „Arbeitszeit Deutschland“ vs. „Frankreich“. Frage: Welche ist höher?
- Nach der Antwort wird die passende Kurve/Balkengrafik eingeblendet.
- Fragen werden zur Laufzeit aus den Datenpunkten erzeugt (nur Paare mit deutlichem Unterschied ≥ 10 Punkte bzw. ≥ 0,5 Std.).

## 11. Abschlussprüfung 👑  (`abschluss` – gehört fest zu jedem Prüfungs-Spiel)
- Jede Prüfung hat ihre **eigene** Abschlussprüfung als „Endgegner“ (Einstellungen in `pruefung.json` → `finalExam`).
- **Typen:** alle · **Runde:** `finalExam.questions` Aufgaben (Standard 20) aus allen Kapiteln dieser Prüfung.
- Kein Feedback zwischendurch, am Ende Note nach IHK-Schlüssel + Auswertung je Kapitel + „Fehler üben“.
- Freigeschaltet, wenn mind. `unlockAtPercent` % der Aufgaben dieser Prüfung einmal richtig beantwortet wurden.
- Beste Note wird auf der Prüfungs-Kachel unter „Meine Prüfungen“ angezeigt.

---

## Auswahl-Logik
- Die Modus-Liste einer Prüfung zeigt nur Modi, für die im gewählten Kapitel genug Items vorhanden sind (`minItems`).
- Die Startseite eines Prüfungs-Spiels schlägt „Heute dran“ vor: das Kapitel mit den meisten fälligen Leitner-Items.
- „Meine Prüfungen“ sortiert nach nächstem Prüfungstermin (ohne Termin ans Ende).
