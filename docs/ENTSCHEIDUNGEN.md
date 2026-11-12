# Entscheidungen

Hier steht, was unklar war und wie ich es entschieden habe (statt nachzufragen).

## Phase 1

1. **Flare-Prototyp ersetzt.** Das Repo enthielt vorher „Flare“ (Dating-App-Prototyp, React/Vite).
   AzubiQuest liegt jetzt im Repo-Root. Flare ist unverändert in der Git-Historie (Commits
   `14f2eb4`, `bec7ee1`, lokaler Tag `flare-prototype`). Wiederherstellen:
   `git checkout flare-prototype -- .` (in einem separaten Ordner/Branch).
2. **Router:** `BrowserRouter` mit sauberen Pfaden (`/p/<id>`). Statisches Hosting braucht dafür einen
   SPA-Fallback (Cloudflare Pages macht das automatisch, für Vercel liegt eine `vercel.json` bei).
3. **Abzeichen-Regeln maschinenlesbar:** In `pruefung.json` steht neben dem lesbaren `rule`-Text ein
   `condition`-Objekt (`typeCorrect`, `allOfType`, `item`, `finalGrade`, `level`, `streak`). Die Engine wertet
   nur `condition` aus – so braucht eine neue Prüfung keinen Code. Der Text `rule` bleibt unverändert.
4. **Extra-Route `/p/:id/modi`** (Tab „Spielmodi“ in der mobilen Navigation und Kapitel-Auswahl). Sie steht
   nicht in der Routentabelle der CLAUDE.md, wird aber für die Bottom-Nav aus dem Mockup gebraucht.
5. **Icons:** Namen aus den JSON-Dateien werden über eine kuratierte Liste in `src/ui/Icon.tsx` aufgelöst
   (kleineres Bundle). Unbekannter Name → Funken-Symbol. Neue Icons dort eintragen.
6. **Themen-Muster:** `theme` in `pruefung.json` wählt ein Hintergrundmuster aus `src/ui/themes.ts`
   (`werkstatt`, `standard`, `arena`, `heft`, `welle`, `sterne`); unbekannte Namen → `standard`.
7. **Level-Formel:** „Level n braucht 100 · n^1,4 XP“ = XP, um Level n abzuschließen (n → n+1), nicht kumulativ.
8. **Note:** Prozentwert wird auf ganze Prozent gerundet, dann IHK-Schlüssel.
9. **Fortschritt:** Zusätzlich zu Box + Datum speichert der Leitner-Eintrag `everCorrect`, `seen`, `wrong`
   (nötig für „einmal richtig beantwortet“ → Freischaltung der Abschlussprüfung und Abzeichen).
10. **npm audit:** Die gemeldeten Schwachstellen betreffen Entwicklungswerkzeuge bzw. zod beim Prüfen eigener,
    statischer Inhalte; kein Nutzereingabe-Pfad. Keine Zwangs-Upgrades auf Major-Versionen.

## Phase 2

11. **Modus-Schnittstelle erweitert (rückwärtskompatibel).** `onAnswer` liefert jetzt das Punkte-Ergebnis zurück
    (`AnswerResult`: Punkte, Bonus, Combo, Gesamt), damit ein Modus „+130“ sofort anzeigen kann, ohne selbst zu
    rechnen. Dazu gibt es die Props `score` und `onClose`. Die Engine bleibt die einzige Stelle, die Punkte, XP,
    Leitner und Streaks vergibt.
12. **Mehrteilige Aufgaben** (Sortieren, später Vertrag, Lücken, Zeitstrahl, Memory) melden `parts {total, correct, errors}`:
    100 Punkte je richtigem Teil (beim ersten Versuch), −50 je Fehlversuch, nie unter 0. Die Aufgabe zählt als „richtig“
    (Leitner, Combo, `everCorrect`), wenn es keinen Fehler gab.
13. **Sterne:** ≥ 90 % richtig = 3, ≥ 60 % = 2, mindestens eins richtig = 1. Bei mehrteiligen Aufgaben zählen die Teile.
14. **Vorzeitig beenden (×):** Die bis dahin erspielten XP bleiben erhalten, Bestwert/Rundenzähler werden nicht gespeichert.
    Beantwortete Aufgaben stehen schon im Leitner-Plan.
15. **Blitz-Modus (Wahr oder Falsch?):** Damit 60 Sekunden reichen, gibt es dort kein Feedback-Sheet, sondern ein kurzes
    Aufblitzen (0,65 s). Die Erklärungen stehen danach im Ergebnis unter „Das kannst du noch üben“.
16. **Sortier-Meister:** Zifferntasten 1–4 legen die Karte direkt in das n-te Fach (PC); falsche Versuche zeigen einen Hinweis,
    ohne die Lösung zu verraten.
17. **Fehler üben** startet eine neue Runde im selben Modus nur mit den falsch beantworteten Aufgaben.
