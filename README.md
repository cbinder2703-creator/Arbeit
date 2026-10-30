# Flare – Dating-App für Web, Windows, macOS, iOS und Android

Eine Codebasis (React + TypeScript + Vite), vier Plattformen:

| Plattform | Technik | Befehl |
|---|---|---|
| Browser / PWA (alle Geräte) | Vite, installierbar, offline-fähig | `npm run dev` · `npm run build` |
| Windows & macOS | Electron | `npm run desktop` · `npm run dist:win` · `npm run dist:mac` |
| iOS & Android | Capacitor | einmalig `npx cap add ios` / `npx cap add android`, dann `npm run cap:ios` / `npm run cap:android` |

> iOS-Builds brauchen einen Mac mit Xcode, `dist:mac` läuft nur auf einem Mac, Android braucht Android Studio.

## Funktionen

- **Entdecken** (Tinder-Prinzip): Swipe per Maus/Touch/Trackpad, Tasten `←` `→` `↑`, `Z` = Zurück, `I` = Profil. Fotos durchtippen, Super-Like, unbegrenztes „Zurück“.
- **In der Nähe** (Lovoo-Prinzip): Raster nach Entfernung / Online / Neu, Online-Status, direkt „Hallo sagen“ ohne Match.
- **Matches & Chat** mit Icebreakern, ungelesen-Zähler.
- **Profil**: Fotos vom Gerät (werden lokal verkleinert), Interessen, Hell/Dunkel/System.
- **Filter**: Alter, Entfernung, Geschlecht, nur online.

### Anzeigeverhalten
- Handy: Vollbild-Karte, Daumen-Leiste unten, Sheets von unten, Safe-Area (Notch/Home-Indikator) berücksichtigt.
- Tablet/Desktop: Seitennavigation; „Entdecken“ zeigt Karte **plus** permanentes Detail-Panel (Galerie, Bio, Interessen) – kein Extra-Klick nötig. Matches als Zwei-Spalten-Ansicht mit Chat.
- Gesten laufen über direkte `transform`-Updates (kein React-Rerender pro Frame), nächste Fotos werden vorgeladen, `prefers-reduced-motion` wird respektiert.

## Wichtig: Stand der Demo

Das ist ein **lauffähiger Frontend-Prototyp ohne Server**:
- Profile sind generierte Beispiele (`src/data.ts`), Fotos sind generierte SVG-Porträts.
- Swipes, Matches, Chats und dein Profil liegen nur im `localStorage` des Geräts; Antworten im Chat sind simuliert.
- Für einen echten Betrieb fehlen: Backend (Auth, Profile, Matching, Chat per WebSocket, Push), Standort-Berechnung, Foto-Speicher/Moderation, Melden/Blockieren, Altersverifikation, Datenschutz/DSGVO, Store-Konten. Alle Datenzugriffe laufen über `src/store.ts` – dort wird später die API angeschlossen.
