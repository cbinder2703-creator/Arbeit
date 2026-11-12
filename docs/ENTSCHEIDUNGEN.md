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
