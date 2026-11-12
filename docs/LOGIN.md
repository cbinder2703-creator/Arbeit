# Login (ein gemeinsamer Zugang für mehrere Leute)

Optional: Wenn beim Veröffentlichen ein Nutzername und ein Passwort gesetzt sind, fragt die App beim ersten Öffnen danach.
Alle, die den Zugang kennen, nutzen dieselben Daten. Auf diesem Gerät bleibt man danach angemeldet (Profil → „Abmelden“).

## Einschalten (am Handy möglich)
1. GitHub → Repository **Arbeit** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
2. Zwei Geheimnisse anlegen:
   - Name `AZUBI_LOGIN_USER`, Wert z. B. `klasse10`
   - Name `AZUBI_LOGIN_PASS`, Wert: ein **langes** Passwort (mindestens 12 Zeichen)
3. **Actions** → „Veröffentlichen (GitHub Pages)“ → neuesten Lauf öffnen → **Re-run all jobs**. Nach 1–2 Minuten ist der Login aktiv.

Das Passwort steht nirgends im Code: Beim Bauen wird nur eine gesalzene PBKDF2-Prüfsumme (SHA-256, 210 000 Runden) eingebaut.
Der Nutzername ist unabhängig von Groß-/Kleinschreibung, das Passwort nicht.

## Ändern / Ausschalten
- **Passwort ändern:** Geheimnis bei GitHub ersetzen, Workflow neu starten → alle müssen sich neu anmelden.
- **Login ausschalten:** beide Geheimnisse löschen, Workflow neu starten.

## Lokal testen
```bash
AZUBI_LOGIN_USER=klasse10 AZUBI_LOGIN_PASS='mein-langes-passwort' npm run dev     # Mac/Linux
$env:AZUBI_LOGIN_USER="klasse10"; $env:AZUBI_LOGIN_PASS="mein-langes-passwort"; npm run dev   # Windows PowerShell
```

## Wichtig: Grenzen (bitte lesen)
- AzubiQuest ist eine **statische Website ohne Server**. Der Login hält Zufallsbesucher draußen, ist aber **kein echter Schutz der Inhalte**:
  Die Aufgaben stecken im Programmcode der Seite, und das GitHub-Repository ist **öffentlich**, dort sind alle Inhalte ohnehin lesbar.
- Das Passwort könnte jemand mit viel Aufwand aus der Prüfsumme erraten → deshalb ein langes, einzigartiges Passwort.
- Der Fortschritt wird pro **Gerät/Browser** gespeichert, nicht pro Person. Wer ein Handy teilt, teilt auch den Fortschritt.
- **Echter Schutz** wäre: Repository auf *privat* stellen und die Seite bei Cloudflare Pages mit „Cloudflare Access“ (kostenlos bis 50 Personen) absichern.
