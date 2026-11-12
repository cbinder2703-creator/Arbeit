# Eine neue Prüfung hinzufügen (= ein neues Spiel)

Jede Prüfung wird ein eigenes Spiel in AzubiQuest – mit eigener Kachel, eigenem Design,
eigenem Fortschritt und eigener Abschlussprüfung. Dafür ist **keine Code-Änderung** nötig.

## Schritt für Schritt

1. Neuen Ordner anlegen: `content/pruefungen/<id>/` (kebab-case, z. B. `vertragsrecht-kaufvertrag`).
2. `pruefung.json` anlegen (Vorlage: `content/pruefungen/berufsbildung-arbeitswelt/pruefung.json`):
   - eigenen `gameTitle` ausdenken (z. B. „Vertrags-Arena“), eigene `color`/`accent`/`theme`
   - `examDate` eintragen, falls der Termin bekannt ist (`"JJJJ-MM-TT"`)
   - jedes Abzeichen braucht neben `rule` (Text) eine `condition` (`typeCorrect`, `allOfType`, `item`, `finalGrade`, `level`, `streak`) – siehe Vorlage
   - `chapters` auflisten, `badges` passend zum Thema
3. Kapiteldateien (`k1-….json`, `k2-….json` …) nach dem Schema in `docs/PLAN.md` anlegen.
   Möglichst alle Aufgabentypen mischen (mc, truefalse, sort, pairs, order, case, spot, cloze),
   damit möglichst viele Spielmodi verfügbar sind. Richtwert: 30–50 Aufgaben + 15 Lernkarten pro Kapitel.
4. `npm run validate-content` → muss grün sein.
5. `npm run dev` → die neue Prüfung erscheint unter „Meine Prüfungen“.
6. `git push` → online.

## Inhalte aus Buchfotos erstellen lassen

Fotos der Buchseiten in den Ordner `vorlagen/<id>/` legen (wird nicht veröffentlicht, steht in `.gitignore`)
und diesen Prompt verwenden:

> Lies docs/NEUE-PRUEFUNG.md. Lege aus den Fotos in vorlagen/<id>/ eine neue Prüfung an.
> Spielname: „…“, Prüfungstermin: …. Übernimm nur Fakten aus den Fotos, formuliere alles
> in eigenen Worten und nutze alle Aufgabentypen. Führe danach validate-content aus.

Danach die erzeugten Fragen einmal selbst gegen das Buch prüfen.

## Regeln
- Lückentexte: Lücken, die nur mit „und“/„oder“/Komma verbunden sind, dürfen im Spiel vertauscht werden.
- Fakten nur aus dem Unterrichtsmaterial – nichts ergänzen oder „aktualisieren“.
- Keine Fotos/Scans in `content/` – nur eigene Formulierungen.
- IDs müssen innerhalb einer Prüfung eindeutig sein (der Fortschritt wird pro Prüfung gespeichert).
