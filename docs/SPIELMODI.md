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

## 12. Boss-Kampf ⚔️  (`boss-kampf`)
Du kämpfst gegen einen Boss (zufälliger Name). Richtige Antwort = Treffer, falsche = der Boss schlägt zu (3 Herzen).
Aufgaben: Multiple Choice und Wahr/Falsch. Pro Frage 20 Sekunden (aus bei „Ohne Zeitdruck“). Boss-Leben = Anzahl Fragen − 2. Sieg mit Konfetti.

## 13. Wer wird Azubionär? 🏆  (`azubionaer`)
15 Fragen, nach Schwierigkeit sortiert, Geldleiter von 50 bis 1 Million Taler. Sicherheitsstufen bei Frage 5 und 10.
Joker: 50:50, Publikum (Prozentbalken, bei leichten Fragen treffsicherer) und Tauschen. „Finale Antwort“ bestätigt, „Aussteigen“ nimmt den aktuellen Betrag mit.

## 14. Blasen-Quiz 🫧  (`blasen-quiz`)
Antworten steigen als Blasen auf – tippe die richtige, bevor sie oben verschwindet. 3 Leben. Bei „Ohne Zeitdruck“ steigen die Blasen langsamer,
bei reduzierter Bewegung steht die Liste still (kein Zeitdruck).

## 15. Begriffe-Raten 🔤  (`wort-jagd`)
Galgenmännchen für Fachbegriffe: Die Erklärung steht da, der Begriff wird Buchstabe für Buchstabe erraten (6 Runden, 6 Leben, Tipp kostet 1 Leben).
Die Erklärung wird so geschwärzt, dass der gesuchte Begriff nicht darin vorkommt. Tastatur auf dem PC, Bildschirmtasten (inkl. Ä Ö Ü ß) am Handy.

## 16. Lern-Runner 🏃  (`lern-runner`)
2D-Lauf in Seitenansicht: Die Strecke hat so viele Spuren wie Antworten (2–4). Du läufst automatisch, weichst Steinen aus und läufst durch das Tor der richtigen Antwort (Spur A–D).
Steuerung: Spur antippen, hoch/runter wischen, ↑ ↓ oder 1–4; die Antwort-Knöpfe unter dem Spielfeld wechseln ebenfalls die Spur. 3 Herzen: Stein getroffen oder falsches Tor = −1. Mit „Ohne Zeitdruck“ ist das Tempo niedriger.

## 17. Turbo-Rennen 3D 🚀  (`turbo-3d`)
Dasselbe Prinzip in 3D (Three.js, lokal gebündelt, wird erst beim Öffnen geladen): Du fährst durch eine Landschaft, weichst Kisten aus und fährst unter dem Schild der richtigen Antwort durch.
Steuerung: links/rechts tippen oder wischen, ← →, 1–4. Ohne WebGL (sehr alte Geräte) erscheint ein freundlicher Hinweis statt eines Fehlers.

## 18. Verlies 🏰  (`verlies`)
Zufälliges Labyrinth (9 × 10 Felder) mit bis zu 7 Monstern. Läufst du in ein Monster, musst du eine Frage lösen: richtig = besiegt, falsch = −1 Herz und die Frage kommt später wieder.
Das Tor ist zu, bis alle Monster besiegt sind. Herzen am Wegesrand heilen. Steuerung: Feld antippen (läuft den kürzesten Weg), wischen, Pfeiltasten/WASD.

## 19. Burg-Wacht 🛡️  (`burg-wacht`)
Tower-Defense: Gegner marschieren in 4 Spuren auf deine Burg (5 Herzen) zu. Jede richtige Antwort gibt einen Baupunkt: Spur antippen (PC: Q W E R) baut oder verstärkt einen Turm (Stufe 1–3).
Eine falsche Antwort schickt zwei zusätzliche, schnellere Gegner. Nach der letzten Frage geht die Verteidigung weiter, bis kein Gegner mehr da ist.

## 20. Elfmeter 3D ⚽  (`elfmeter-3d`)
Du stehst am Elfmeterpunkt, im Tor liegen 2–4 Antwort-Felder (A–D). Tippe ein Feld an (oder wähle die Antwort unten, PC: 1–4): Richtig = Torwart springt in die falsche Ecke → Tor. Falsch = er hält.
Keine Herzen: Alle Fragen werden geschossen, ab 60 % Toren gilt die Runde als gewonnen.

## 21. Raumflug 3D 🛰️  (`raumflug-3d`)
Frei steuerbares Raumschiff (nicht nur Spuren): Finger oder Maus ziehen, das Schiff folgt; PC: Pfeiltasten oder 1–4. Felsen umfliegen, am Ende durch den Ring mit der richtigen Antwort. Der Ring, dem du am nächsten bist, leuchtet auf und zählt.
3 Herzen (Fels getroffen oder falscher Ring = −1).

## 22. Turmbau 3D 🧱  (`turm-3d`)
Richtig = ein neuer Block fällt auf den Turm (jeder 5. ist golden), die Kamera kreist und steigt mit. Falsch = der Turm wackelt, der oberste Block fällt herunter und du verlierst ein Herz.
Am Ende steht, wie hoch dein Turm ist.

## Auswahl-Logik
- Die Modus-Liste einer Prüfung zeigt nur Modi, für die im gewählten Kapitel genug Items vorhanden sind (`minItems`).
- Die Startseite eines Prüfungs-Spiels schlägt „Heute dran“ vor: das Kapitel mit den meisten fälligen Leitner-Items.
- „Meine Prüfungen“ sortiert nach nächstem Prüfungstermin (ohne Termin ans Ende).

---

## Hinweise zur Umsetzung (siehe `docs/ENTSCHEIDUNGEN.md`)
- Kündigungs-Gericht zeigt Erklärung und Paragraf direkt unter den Antworten (wie im Handy-Mockup), alle anderen Modi per Feedback-Sheet.
- Wahr oder Falsch? im **Blitz-Modus** (Profil → Einstellungen): 60 Sekunden gesamt, kurzes Aufblitzen statt Sheet.
- Quiz-Blitz im **Entspannt-Modus**: kein Timer, kein Zeitbonus.
- In der Abschlussprüfung läuft jede Aufgabe im passenden Modus **ohne Feedback** (Memory als Zuordnungsliste).
- **Sprach-Modi (nur Prüfungen mit passenden Aufgaben):** *Satz bauen* (Wörter antippen, `translate`), *Hören* (Satz anhören und wählen, `listen`), *Sprechen* (Satz nachsprechen mit Mikrofon nach Zustimmung oder Selbstbewertung, `speak`).
- **Lernpfad:** Prüfungen mit `lessons` haben den Tab „Pfad“ (Lektionen nacheinander, Grammatik-Tipp, Sterne).
- **Begriff nachschlagen:** In allen Aufgaben-Modi gibt es oben den Knopf „Begriff?“ (Glühbirne). Er zeigt passende Lernkarten und eine Suche; nicht in der Abschlussprüfung.
