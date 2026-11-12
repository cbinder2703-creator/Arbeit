# Veröffentlichen unter eigener Domain

Die App ist eine statische Seite (kein Server nötig) → kostenloses Hosting reicht.

## Variante A: Cloudflare Pages (empfohlen)
1. Code in ein GitHub-Repository hochladen (privat geht auch).
2. Cloudflare-Konto → Workers & Pages → „Create“ → Pages → mit GitHub verbinden → Repo wählen.
3. Build-Einstellungen: Framework „Vite“, Build-Befehl `npm run build`, Ausgabeordner `dist`.
4. Nach dem ersten Build: „Custom domains“ → Domain eintragen (z. B. `azubiquest.de` oder Subdomain `lernen.deinedomain.de`).
5. DNS: Liegt die Domain bei Cloudflare, wird alles automatisch eingerichtet. Sonst beim Domain-Anbieter einen **CNAME** auf `<projekt>.pages.dev` setzen (für die Hauptdomain ggf. die Nameserver zu Cloudflare umziehen).
6. HTTPS kommt automatisch.

## Variante B: Vercel
Gleiches Prinzip: Repo importieren → Framework Vite → Domain unter „Settings → Domains“ eintragen → DNS-Eintrag (A-Record bzw. CNAME) laut Vercel-Anzeige beim Domain-Anbieter setzen.

## Ab dann
Jeder `git push` auf `main` baut und veröffentlicht automatisch. Neue Spiele = Push = online.

## Vor dem Veröffentlichen
- [ ] Impressum und Datenschutzerklärung mit echten Angaben ausfüllen (in Deutschland für öffentliche Seiten Pflicht).
- [ ] Keine Fotos/Scans aus dem Schulbuch hochladen – nur die eigenen Formulierungen aus `content/`.
- [ ] Wenn die Seite öffentlich (nicht nur für die eigene Klasse) ist: Namen in den Fallbeispielen ggf. austauschen.
- [ ] Auf echtem Handy testen (iPhone Safari + Android Chrome), „Zum Home-Bildschirm“ ausprobieren.
