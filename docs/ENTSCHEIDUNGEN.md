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
38. **Lückentext: austauschbare Lücken.** Lücken, die nur durch „und“, „oder“, Komma, „sowie“, „&“ oder „/“ verbunden sind
    (z. B. „{{Berufsschule}} und {{Ausbildungsbetrieb}}“), dürfen in beliebiger Reihenfolge ausgefüllt werden (`src/modes/lueckentext/evaluate.ts`).
    Gilt für alle Prüfungen automatisch. Wenn bei neuen Inhalten Reihenfolge wichtig ist, den Text so formulieren, dass dazwischen mehr als
    ein Bindewort steht (z. B. „… nach dem …“).

## Login und Bedienung auf dem Handy

39. **Gemeinsamer Login (optional)** über GitHub-Geheimnisse `AZUBI_LOGIN_USER` / `AZUBI_LOGIN_PASS`, beim Bauen als gesalzene PBKDF2-Prüfsumme
    eingesetzt (`src/auth/`, `docs/LOGIN.md`). Ohne Geheimnisse ist die App offen (wie bisher). Das ist bewusst nur eine Türsteher-Funktion
    für eine statische Seite; die Grenzen stehen in `docs/LOGIN.md`.
40. **Kein Markieren beim Ziehen/Wischen:** Spielelemente sind `user-select: none` und ohne iOS-Kontextmenü (`.no-select`, Buttons global).
41. **Zeitstrahl am Handy:** zusätzlich zum Ziehen am Griff: Zeile antippen und mit „Hoch“/„Runter“ (große Knöpfe) verschieben.

## Englisch (English Quest)

42. **Eigenes Spiel „English Quest“** (`content/pruefungen/englisch-b1/`, Niveau B1, Themen: Alltag & Reisen, Beruf & Ausbildung, Freizeit & Leute,
    Schule & Prüfung). 4 Einheiten × 3 Lektionen × 8 Aufgaben = 96 Aufgaben, 56 Lernkarten. **Alle Inhalte sind von Claude selbst geschrieben**
    (kein Schulbuch, nichts kopiert) und sollten von einer Lehrkraft gegengelesen werden (siehe `docs/OFFENE-FRAGEN.md`).
43. **Neue Aufgabentypen** (für alle Prüfungen nutzbar): `translate` (Satz aus Wörtern bauen, Alternativen in `alt`, falsche Wörter in `extra`),
    `listen` (Satz hören und den richtigen wählen), `speak` (Satz laut nachsprechen). Neue Modi: **Satz bauen**, **Hören**, **Sprechen**.
    Sie erscheinen nur in Prüfungen mit passenden Aufgaben (Azubi-Akademie unverändert).
44. **Lernpfad (generisch):** Kapitel können `lessons` haben (Titel, optional `grammar`-Tipp, Aufgaben-IDs). Der Pfad schaltet Lektionen nacheinander frei
    (Vorgänger geschafft), Sterne nach Trefferquote der ersten Runde (mindestens 1 Stern), falsche Aufgaben werden am Ende einmal wiederholt.
    Keine Herzen/Tagesziele (nicht gewünscht). Fortschritt: `lessons` im Prüfungs-Fortschritt; ältere Speicherstände werden automatisch aufgefüllt.
45. **Vorlesen** (`speech` in `pruefung.json`, hier `en-GB`, Tempo 0,95): 🔊 bei Lernkarten, Beispielen, Lösungen und im Modus Hören; läuft auf dem Gerät
    (Web Speech API). Ohne Sprachausgabe wird der Satz zum Lesen angezeigt. Britisches Englisch ist voreingestellt – für amerikanisches `en-US` setzen.
46. **Sprechen:** nutzt die Spracherkennung des Browsers, die je nach Browser Audio an den Hersteller schickt → **nur nach ausdrücklicher Zustimmung**
    (Einstellung `speechConsent`); sonst „Ohne Mikrofon üben“ (Selbstbewertung) oder Überspringen. Bestanden ab 80 % übereinstimmender Wörter, bis 3 Versuche.
    Funktioniert nicht in jedem Browser (z. B. Firefox) und braucht HTTPS. Nicht Teil des Abschlusstests.
47. **Abschlusstest Englisch:** wie die Abschlussprüfung, aber ohne Sprech-Aufgaben (kein Feedback-freier Modus); Hören und Satz bauen sind dabei.
48. **Lückentext:** gleiche Wörter in mehreren Lücken bekommen jeweils einen eigenen Chip.

## Konten (Supabase)

49. **Konten mit Nutzername + Passwort, ohne E-Mail** (Wunsch des Nutzers), **offene Registrierung**. Nutzername → Pseudo-Adresse, dadurch eindeutig und ohne Mailversand (`src/cloud/`, `docs/SUPABASE.md`).
    Ohne Werte in `src/cloud/config.ts` ist die Funktion aus. Der alte gemeinsame Login (`AZUBI_LOGIN_*`) bleibt als Alternative bestehen; mit Konten ist er nicht nötig.
50. **Abgleich Gerät ↔ Cloud:** Zusammenführen je Wert (der bessere Stand), Hochladen gebündelt nach 4 s und erst nach dem ersten erfolgreichen Abholen. XP werden bei Parallelnutzung nicht addiert. Zurücksetzen gewinnt per Zeitstempel (`resetAt`).
51. **Profil:** „Konto“ (Name, Speicherstand, Abmelden, Konto löschen) und „Fortschritt zurücksetzen“ je Prüfung (zweistufig, ohne `window.confirm`). Kein „Passwort vergessen“ (keine E-Mail) – Zurücksetzen nur durch den Betreiber per SQL.
52. **Datenschutztext** wechselt automatisch auf „Konto“, sobald Cloud aktiv ist. Verantwortlicher/Impressum fehlen weiterhin (auf Wunsch weggelassen) – bei Konten rechtlich heikel, siehe `docs/SUPABASE.md`.

## Print-Profi (LF2)

53. **Eigenes Spiel „Print-Profi“** (`content/pruefungen/lf2-daten-nutzen/`) aus den Arbeitsblättern LF2 (LS1 Steckbrief/DIN, LS2 Schriften, LS3 Licht/Auge/Farbmischung/E-Mail, LS4 Auflösung/Weihnachtskarte).
    6 Kapitel, 21 Lektionen mit „Kurz erklärt“, 192 Aufgaben, 88 Lernkarten, 7 Abzeichen. Alles in eigenen Worten, keine Scans. Das Spiel hat bewusst **keinen Prüfungstermin** (`examDate: null`) – bitte eintragen, sobald bekannt.
    Die Lektions-Erklärungen nutzen das Feld `examples` mit `en` = Begriff und `de` = Erklärung (Feldnamen stammen vom Englisch-Spiel).
54. **Handschriftliche Antworten wurden geprüft, nicht blind übernommen.** Wo die Antwort auf den Blättern falsch oder ungenau war, steht in den Aufgaben die richtige Fassung (z. B. 8 × A4 in A1, black/fett, Grün absorbiert kurz- und langwellig).
    Die Gegenüberstellung steht in **„Arbeitsblätter prüfen“** (neue optionale Datei `korrektur.json` + Seite `/p/:id/korrektur`; 68 Einträge: 44 richtig, 6 falsch, 5 ungenau, 12 Lösung ergänzt, 1 unsicher).
55. **Allgemeinwissen als Ergänzung** (steht nicht wörtlich auf den Blättern): Begriffe des Vier-Linien-Systems (Ober-/Mittel-/Unterlänge, Versalhöhe), Hauptaufgaben von Photoshop/Illustrator/InDesign, Schnittmarken und Beschnitt (üblich ca. 3 mm), Punze. Diese Stellen sind in der Korrektur kenntlich gemacht.
56. **Nicht aufgenommen:** reine Zeichen-/Färbeaufgaben, Aufgaben, die nur mit dem Bild lösbar sind (z. B. Nummern im Augen-Schema, Buchstaben am Muster-wort „Hamburgo“) sowie die Aussage „Workflow = Eingabe und Ausgabe“ (siehe `docs/OFFENE-FRAGEN.md`).
57. **Neu, allgemein nutzbar:** Hintergrundmuster `raster` (Halbton-Punkte), Icons printer/palette/ruler/sun, Einheit „mm“ bei „Höher oder tiefer?“ (Titel mit „(mm)“), optionale `korrektur.json`.

## Spielvielfalt & Aufräumen

58. **Modi, die zu einem Fach nicht passen, werden nicht angezeigt.** Die Modi-Seite listet nur Modi, die für die gewählte Auswahl wirklich Inhalte haben; der Rest steht eingeklappt unter „N weitere Modi – in diesem Kapitel nicht verfügbar“.
    Print-Profi hat weder „Kündigungs-Gericht“ noch „Vertrags-Detektiv“ (keine `case`-/`spot`-Aufgaben). Dafür gibt es dort eine Sortier-Aufgabe „Passt die Zeile der E-Mail zu den Vorgaben?“.
59. **Vier neue, fachunabhängige Spielmodi** (Plugins, keine Prüfungs-Sonderfälle): Boss-Kampf, Wer wird Azubionär?, Blasen-Quiz, Begriffe-Raten. Sie erscheinen automatisch in jeder Prüfung mit passenden Inhalten (mc/truefalse bzw. Lernkarten).
60. **Azubionär ist ein Spiel, kein Test:** Joker und Aussteigen ändern nur den Spielstand; XP und Leitner-Boxen werden wie überall von der Engine vergeben. Die Prozentbalken beim Publikum sind Zufall mit Schwierigkeitsbezug, keine echten Daten.
61. **Begriffe-Raten** nutzt nur Lernkarten, deren Begriff 4–20 Buchstaben hat (ohne Klammerzusätze, bei „A / B“ gilt der erste Teil). Alles andere wird übersprungen.
62. **Blasen-Quiz und Boss-Kampf** respektieren „Ohne Zeitdruck“ und `prefers-reduced-motion` (kein Zeitverlust, keine Bewegung).

## Echte Spiele & Klassenarbeits-Blatt

63. **Vier Spiele mit Spielfläche** (`lern-runner`, `turbo-3d`, `verlies`, `burg-wacht`) bleiben normale Plugins: gleiche Aufgaben (mc/Wahr-Falsch), gleiche Engine-Punkte. Gemeinsame Bausteine liegen in `src/ui/game/` (Spielfläche mit Schleife, Gesten, Herzen, Endbildschirm, Antwort-Knöpfe) und `src/engine/` (`choices.ts`, `laneRun.ts`) – kein Modus importiert einen anderen.
64. **Grafik ohne Bilddateien:** Figuren sind Emojis und einfache Formen (2D) bzw. Würfel/Kegel (3D). Dadurch offline, ohne Lizenzfragen und klein. Three.js wird über npm eingebunden (keine externe CDN, DSGVO) und nur geladen, wenn das 3D-Spiel geöffnet wird.
65. **Barrierefreiheit der Spiele:** Jede Spielfläche hat ein `aria-label`; alle Antworten stehen zusätzlich als Knöpfe darunter (Antippen wechselt die Spur). „Ohne Zeitdruck“ und `prefers-reduced-motion` machen Runner, Rennen und Burg-Wacht langsamer.
66. **Burg-Wacht ist ausbalanciert getestet:** In `defense.test.ts` gewinnt, wer alles richtig macht (40 Zufallspartien), mit zwei Fehlern fast immer, und wer nichts richtig macht, verliert immer.
67. **Klassenarbeit-Wiederholung (Blatt „Wiederholung KA 26“)** ist Teil von Print-Profi: Kapitel 7 „Klassenarbeit: Wiederholung“ (4 Lektionen zu Aufgabe 1–7) und Kapitel 8 „Dreisatz“ (2 Lektionen). Das Blatt hatte keine Lösungen – alle Lösungen sind aus dem Stoff der übrigen Blätter bzw. gerechnet; sie stehen auch in „Arbeitsblätter prüfen“ (Blatt „Wiederholung für die Klassenarbeit“, Status „Lösung ergänzt“).
68. **Auf dem Blatt unklar** (siehe `docs/OFFENE-FRAGEN.md`): „DIN4“ wurde als DIN A4 gelesen; die kursive Zierschrift in Aufgabe 1 als Schreibschrift; „Schwarz (400 %)“ als alle vier Druckfarben übereinander. Die zwei „Übung“-Aufgaben im Dreisatz sind eigene Rechenbeispiele in demselben Stil.

## Mehr 3D-Spiele

69. **Gemeinsame 3D-Basis** in `src/ui/game3d/`: `Base3D` (Renderer, Szene, Kamera, Licht, Aufräumen), `useScene3D` (Szene im Host-Element, eigene Spielschleife, WebGL-Fallback), `NoWebGL`, Textur-Helfer für Antwortschilder. Neue 3D-Spiele brauchen nur noch eine Szene-Klasse und die Spielregeln.
70. **Drei weitere 3D-Spiele:** Elfmeter (Tor-Felder), Raumflug (freie Steuerung in der Ebene, Logik in `src/engine/spaceRun.ts`, Feld-Lage in `src/engine/zones.ts`) und Turmbau. Wie bei Turbo-Rennen gilt: Antworten stehen immer auch als Knöpfe darunter, 3D-Szenen werden nur geladen, wenn das Spiel geöffnet wird.
71. **Das Tor im Elfmeter ist vergrößert** (9 × 3,2 m statt 7,32 × 2,44 m), damit die Antwort-Felder auf kleinen Bildschirmen gut treffbar sind.
72. **Deine Antworten zur Klassenarbeits-Wiederholung wurden geprüft** (Fotos Seite 1–3): Von 20 geprüften Punkten waren 16 richtig und 4 ungenau (3a „4/1“ statt 4/4, 2a Serife und Gemeine nicht markiert, 5d dritte Grundfarbe „Black“ statt Blau, 6a Absorbieren: B statt G). Die Einträge stehen in „Arbeitsblätter prüfen“. Aus deinem durchgestrichenen Versuch bei 7f kam eine neue Aufgabe zu mm² → cm² (durch 100), und „ohne Rechenweg keine Punkte“ steht jetzt in der Lektion und auf einer Lernkarte.
73. **Normformate aus dem Buch (S. 49–50)** sind als letzte Lektion von K1 eingebaut (damit die IDs der bisherigen Lektionen und der gespeicherte Fortschritt unverändert bleiben): drei Grundsätze, Flächen und Maße A0–A6, B0/C0, Normen-Institute, Rohformate (5 % größer). Alle Zahlen stammen von den Buchseiten; dazu 5 neue Lernkarten.
