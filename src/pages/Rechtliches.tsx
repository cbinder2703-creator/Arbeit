import type { ReactNode } from 'react';

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="max-w-2xl space-y-3 leading-relaxed">
      <h1 className="text-3xl">{title}</h1>
      {children}
    </article>
  );
}

export function Impressum() {
  return (
    <Page title="Impressum">
      <p>AzubiQuest ist ein privates, nicht kommerzielles Lernprojekt ohne Werbung und ohne Gewinnerzielungsabsicht.</p>
      <h2 className="pt-2 text-xl">Inhalte</h2>
      <p>Die Lerninhalte sind eigene Formulierungen zum Unterrichtsstoff der Berufsschule. Sie ersetzen kein Schulbuch und keine rechtliche Beratung.</p>
    </Page>
  );
}

export function Datenschutz() {
  return (
    <Page title="Datenschutz">
      <h2 className="pt-2 text-xl">Kurz gesagt</h2>
      <p>AzubiQuest speichert deinen Lernfortschritt ausschließlich <b>lokal in deinem Browser</b> (localStorage). Es gibt kein Konto, kein Backend, keine Tracker, keine Werbung und keine externen Schriften oder Skripte.</p>
      <h2 className="pt-2 text-xl">Was wird gespeichert?</h2>
      <p>XP, Level, Abzeichen, Noten, Wiederholungs-Plan und Einstellungen – nur auf deinem Gerät. Beim Löschen der Website-Daten im Browser ist alles weg.</p>
      <h2 className="pt-2 text-xl">Mikrofon (nur im Modus „Sprechen“)</h2>
      <p>Das Mikrofon wird nur benutzt, wenn du es im Modus „Sprechen“ ausdrücklich erlaubst. Dabei nutzt dein Browser seine eingebaute Spracherkennung und schickt die Aufnahme je nach Browser zur Auswertung an dessen Hersteller (z. B. Google oder Apple). AzubiQuest selbst empfängt und speichert keine Aufnahmen. Du kannst jederzeit „Ohne Mikrofon üben“ wählen. Das Vorlesen von Sätzen läuft auf deinem Gerät.</p>
      <h2 className="pt-2 text-xl">Hosting</h2>
      <p>Beim Aufruf der Seite verarbeitet der Hosting-Anbieter technisch notwendige Server-Logdaten (z. B. IP-Adresse). Anbieter: GitHub Pages (GitHub, Inc., USA).</p>
      <h2 className="pt-2 text-xl">Deine Rechte</h2>
      <p>Du hast Rechte auf Auskunft, Berichtigung, Löschung und Beschwerde bei einer Aufsichtsbehörde.</p>
    </Page>
  );
}
