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

## Phase 3

18. **Kündigungs-Gericht:** Die Erklärung erscheint wie im Mockup (Handy-Mockup 4) direkt unter den Antworten statt als
    Bottom-Sheet; Urteil erst nach „Urteil sprechen“ (oder Enter), damit nicht versehentlich geantwortet wird.
19. **Vertrags-Detektiv:** Punkte nur für gefundene Fehler (100 je Fehler), −50 je zu Unrecht markierter Zeile; nicht
    markierte korrekte Zeilen bringen keine Gratispunkte. Die Checkliste (`contractChecklist`) kommt über `ModeProps.checklist`.
20. **Memory:** 6 Paare aus `pairs`-Aufgaben; reicht das nicht (z. B. Kapitel 2 hat nur eine Paar-Aufgabe mit 5 Paaren),
    wird mit den Lernkarten aufgefüllt, deren Definition ≤ 70 Zeichen hat (längere passen nicht lesbar auf eine Karte).
    Gespeichert werden Bestwerte für Züge und Zeit (weniger ist besser). Punkte: 100 je Paar-Quelle.
21. **Lückentext / Zeitstrahl:** 3 Aufgaben pro Runde; 100 Punkte je richtiger Lücke bzw. je Schritt an der richtigen
    Stelle, keine Minuspunkte. Zeitstrahl: Ziehen am Griff (framer-motion `Reorder`), ↑/↓ auf der fokussierten Zeile,
    ab 768 px zusätzliche Hoch/Runter-Knöpfe.
22. **Lernkarten:** Antworten erst nach dem Umdrehen. „Nochmal“ stellt die Karte einmal hinten an; ans Leitner-System geht
    nur die erste Bewertung pro Karte. Im Ergebnis steht „Gewusst“ statt Punkte (`noScore`).
23. **Seite `/p/:id/karten`:** Alle Lernkarten zum Nachschlagen (nach Kapitel filterbar, Leitner-Box sichtbar) plus Knopf
    „Lernen starten“ (Modus Lernkarten).

## Phase 4

24. **Abschlussprüfung nutzt die vorhandenen Spielmodi.** Jede Aufgabe wird mit dem passenden Modus gezeigt (`supportsExam`,
    Prop `exam`): ohne Feedback und ohne Zeitlimit, die Antwort wird nur festgehalten („Weiter“). Zuordnung nach Aufgabentyp
    aus der Modus-Registry (mc/truefalse → Quiz-Blitz, sort → Sortier-Meister, case → Kündigungs-Gericht, spot →
    Vertrags-Detektiv, cloze → Lückentext, order → Zeitstrahl, pairs → Memory als Zuordnungsliste). Ein neuer Modus mit
    `supportsExam: true` wird automatisch berücksichtigt.
25. **Aufgaben der Prüfung:** `finalExam.questions` Aufgaben, anteilig nach Kapitelgröße gezogen und gemischt. Mehrteilige
    Aufgaben zählen mit Teilpunkten (Fehler ziehen ab). Note = IHK-Schlüssel auf den gerundeten Gesamtprozentwert.
    „Bestanden“ = Note 4 oder besser. Vorzeitiges Beenden (×) wertet die Prüfung nicht.
26. **Freischaltung:** Fortschritt wird **abgerundet** angezeigt und verglichen, damit „frei ab 60 %“ wirklich ≥ 60 % heißt und
    100 % nur bei wirklich allem erscheint.
27. **Fehler üben** nach der Prüfung: die falschen Aufgaben nacheinander, jede im passenden Modus mit Feedback; XP und
    Leitner werden normal gutgeschrieben.
28. **Höher oder tiefer?:** Fragen entstehen zur Laufzeit aus `charts` (Paare mit ≥ 10 Punkten bzw. ≥ 0,5 Std. Unterschied,
    bei anderen Einheiten ≥ 15 % der Spannweite), reihum aus allen Diagrammen. Frage-IDs `chart:…` landen im Leitner-Speicher,
    zählen aber nicht in Kapitel-/Prüfungsfortschritt.
29. **Abzeichen** erscheinen auf der Prüfungs-Startseite und im Profil; neu erreichte werden im Ergebnis gezeigt.
30. **PWA:** vite-plugin-pwa mit `autoUpdate`; alle Dateien werden vorab geladen (Inhalte stecken im JavaScript), dadurch ist die App
    offline spielbar. Icons wurden aus einem einfachen Blitz-Symbol erzeugt – gern später durch ein eigenes Logo ersetzen
    (`public/icon-*.png`, `public/favicon.svg`).
31. **Impressum/Datenschutz** sind mit Platzhaltern gefüllt ([…]) und müssen vor dem Veröffentlichen mit echten Angaben
    ausgefüllt werden (`src/pages/Rechtliches.tsx`). Das kann ich nicht für dich erfinden.
32. **Lighthouse mobil (Produktions-Build, lokal gemessen):** Performance 93 · Barrierefreiheit 95 · Best Practices 100 · SEO 91.

## Veröffentlichung

33. **Hosting: GitHub Pages** statt Cloudflare Pages (nur Handy verfügbar, Repository ist öffentlich, Domain `lerndruck.de`
    liegt bei Strato). Deployment per GitHub Actions (`.github/workflows/deploy.yml`) bei jedem Push auf `main`;
    `public/CNAME` enthält die Domain; `404.html` ist eine Kopie von `index.html` (SPA-Fallback für `/p/…`).
34. **Impressum auf Wunsch ohne Namen und Anschrift.** Die Seite enthält nur den Hinweis auf ein privates, nicht kommerzielles
    Projekt. Ob das für die geplante Nutzung rechtlich ausreicht, habe ich nicht geprüft – bei öffentlichem Angebot mit
    „geschäftsmäßigem“ Charakter besteht in Deutschland Impressumspflicht (Name + Anschrift). Nachtragen: `src/pages/Rechtliches.tsx`.
35. **Standard-Branch heißt `master`** (nicht `main`). Der Workflow löst bei Push auf `main` oder `master` aus; `docs/DEPLOYMENT.md`
    spricht von `main` und meint den Standard-Branch.

## Nachschlagen (nach dem Livegang)

36. **„Begriff?“-Knopf in den Spielmodi.** Er öffnet die Erklärungen aus den Lernkarten (`flashcards` in `content/`), die zum Text der aktuellen
    Aufgabe passen (Begriff oder Kürzel wie „HwO“ kommt im Text vor), plus eine Suche über alle Begriffe der Prüfung. Es werden keine
    eigenen Erklärungen erfunden: Gibt es keine passende Lernkarte, steht das ehrlich da. Für fehlende Begriffe die Lernkarte ergänzen
    (`flashcards` im Kapitel) – dann erscheint sie automatisch.
37. **Nicht in der Abschlussprüfung** (wäre ein Hilfsmittel) und nicht im Blitz-Modus von „Wahr oder Falsch?“. Im Quiz-Blitz hält der
    Timer an, solange das Fenster offen ist. Tastenkürzel ruhen, solange ein Fenster offen ist.
