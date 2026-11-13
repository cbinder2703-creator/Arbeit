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
