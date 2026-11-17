# Offene Fragen

Hier stehen Punkte, bei denen Inhalte fehlen oder unklar sind (nichts wurde geraten).

- **Kapitel-1-Titel:** In `content/` heißt Kapitel 1 „Formen der Berufsbildung“ (Mockups nennen es „Duales System“). Es gilt der Titel aus `content/`.
- **Mindestvergütung:** Die Inhalte nutzen die Buchwerte (z. B. 682 € laut Buch) und wurden nicht „aktualisiert“.
- **Impressum/Datenschutz:** echte Angaben (Name, Anschrift, E-Mail, Hosting-Anbieter) müssen eingetragen werden.
- **Prüfungstermin:** `examDate` in `content/pruefungen/berufsbildung-arbeitswelt/pruefung.json` ist `null` – sobald der Termin feststeht, als `"JJJJ-MM-TT"` eintragen, dann erscheinen Countdown und Lernplan-Hinweis.
- **Logo:** Das App-Icon ist ein einfaches Platzhalter-Symbol.
- **Englisch-Inhalte gegenlesen:** Die 96 Aufgaben und 56 Lernkarten von „English Quest“ hat Claude selbst geschrieben (B1). Bitte von einer Lehrkraft oder jemandem mit gutem Englisch prüfen lassen (Übersetzungen, natürliche Formulierungen, „alt“-Lösungen). Fehler bitte in `content/pruefungen/englisch-b1/` korrigieren.
- **Britisch oder amerikanisch?** Vorlesen/Sprechen ist auf `en-GB` eingestellt (`speech.lang` in `pruefung.json`).
- **Wörter fehlen?** Bei Übersetzungen akzeptiert die App nur die Hauptlösung und die Sätze in `alt`. Wenn eine richtige Variante abgelehnt wird, bitte melden, dann kommt sie als `alt` dazu.
- **Konten & Datenschutz:** Sobald Supabase aktiv ist, werden Nutzernamen und Fortschritt auf einem Server gespeichert. Impressum/Verantwortlicher, Auftragsverarbeitungsvertrag mit Supabase und ggf. Einwilligung bei Minderjährigen sind zu klären (siehe `docs/SUPABASE.md`).
- **LF2-Inhalte gegenlesen (Print-Profi):** Aufgaben, Erklärungen und Lernkarten hat Claude aus den Arbeitsblättern geschrieben. Bitte mit Heft/Lehrkraft gegenprüfen, besonders: Zuordnung P/Q/R am Muster-wort „Hamburgo“ (Kehlung, Halbserife, geschlossene Punze), Nummern im Augen-Schema (Nr. 3 Netzhaut), und das letzte Arial-Beispiel bei den Schriftschnitten.
- **Workflow Eingabe/Ausgabe (LS4, Übungsfrage 1b):** Auf den Blättern steht nicht, ob „Eingabe und Ausgabe“ vollständig ist. Üblich sind drei Bereiche (Eingabe – Verarbeitung – Ausgabe), die Aussage wäre dann falsch. Diese Frage ist nicht im Spiel; in „Arbeitsblätter prüfen“ steht sie als „Unsicher“.
- **Prüfungstermin LF2:** `examDate` in `content/pruefungen/lf2-daten-nutzen/pruefung.json` ist leer.

## Wiederholung KA 26 (LF2)

Mit deinen Handschrift-Fotos (Seiten 1–3) sind diese Punkte geklärt: „DIN4“ = DIN A4; die Zierschrift in Aufgabe 1a = Schreibschrift (kalligrafische Schrift); Schwarz (400 %) = Cyan + Magenta + Yellow + Black. Das ist deine eigene Lösung, bestätigt von der Lehrkraft ist sie nicht.

Noch offen:
- Aufgabe 2b: Die Namen der vier Linien (Ober-, Mittel-, Schrift-, Unterlinie) sind allgemeines Fachwissen und stehen nicht wörtlich auf den anderen Blättern.
- Aufgabe 6a: Bei „Absorbieren“ ist auf dem Foto (G) oder (B) zu lesen; richtig ist B (Blau).
- Seite 4 (Dreisatz) wurde nicht fotografiert – dort gilt nur die Musterlösung.

## Raster-Meister (LF7)

- **Rasterwinkel:** Das Arbeitsblatt nennt Yellow 0°, Cyan 15°, Schwarz 45°, Magenta 75° (DIN 16 547). Die Photoshop-Anleitung (Schritte 7 und 8) nutzt Cyan 105°, Magenta 165°, Gelb 0°, Schwarz 45°. Welche in der Prüfung gelten soll, ist offen.
- **Merkmalstabelle Rastermodulation:** „Hohe Prozesssicherheit und gute Wiederholbarkeit“ (AM) und „Fotorealistisches Ergebnis auch bei schlechteren Papiersorten“ (FM) stehen nicht wörtlich im Text.
- **Moiré, zwei Ursachen:** Im Text steht nur „keine Winkelabstände der Punktreihen“.
- **Fotos und Zeichenaufgaben** (Rasterzähler, Druckverfahren an Abbildungen, Rastermodulation bestimmen, Punktformen beschreiben) konnten nicht gelöst werden.
- **Prüfungstermin** für LF7 fehlt (`examDate` ist leer).
