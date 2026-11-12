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
      <p className="rounded-xl border border-xp/50 bg-xp/10 p-3 text-sm">
        Platzhalter: Vor der Veröffentlichung hier die echten Angaben eintragen (Datei <code>src/pages/Rechtliches.tsx</code>).
      </p>
      <h2 className="pt-2 text-xl">Angaben gemäß § 5 DDG</h2>
      <p>[Vor- und Nachname]<br />[Straße und Hausnummer]<br />[PLZ Ort]</p>
      <h2 className="pt-2 text-xl">Kontakt</h2>
      <p>E-Mail: [deine E-Mail-Adresse]</p>
      <h2 className="pt-2 text-xl">Inhalte</h2>
      <p>Die Lerninhalte sind eigene Formulierungen zum Unterrichtsstoff der Berufsschule. Sie ersetzen kein Schulbuch und keine rechtliche Beratung.</p>
    </Page>
  );
}

export function Datenschutz() {
  return (
    <Page title="Datenschutz">
      <p className="rounded-xl border border-xp/50 bg-xp/10 p-3 text-sm">
        Platzhalter: Verantwortlichen-Angaben vor der Veröffentlichung ergänzen (Datei <code>src/pages/Rechtliches.tsx</code>).
      </p>
      <h2 className="pt-2 text-xl">Kurz gesagt</h2>
      <p>AzubiQuest speichert deinen Lernfortschritt ausschließlich <b>lokal in deinem Browser</b> (localStorage). Es gibt kein Konto, kein Backend, keine Tracker, keine Werbung und keine externen Schriften oder Skripte.</p>
      <h2 className="pt-2 text-xl">Was wird gespeichert?</h2>
      <p>XP, Level, Abzeichen, Noten, Wiederholungs-Plan und Einstellungen – nur auf deinem Gerät. Beim Löschen der Website-Daten im Browser ist alles weg.</p>
      <h2 className="pt-2 text-xl">Hosting</h2>
      <p>Beim Aufruf der Seite verarbeitet der Hosting-Anbieter technisch notwendige Server-Logdaten (z. B. IP-Adresse). Anbieter: [Hosting-Anbieter eintragen].</p>
      <h2 className="pt-2 text-xl">Deine Rechte</h2>
      <p>Du hast Rechte auf Auskunft, Berichtigung, Löschung und Beschwerde bei einer Aufsichtsbehörde. Kontakt siehe Impressum.</p>
    </Page>
  );
}
