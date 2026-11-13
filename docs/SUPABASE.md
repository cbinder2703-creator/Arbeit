# Konten & Fortschritt in der Cloud (Supabase)

Mit Konten registriert sich jede Person selbst (Nutzername + Passwort, **keine E-Mail**). Der Fortschritt liegt im Konto und gilt auf jedem Gerät.
Ohne Konfiguration (leere Werte in `src/cloud/config.ts`) bleibt alles wie bisher: kein Konto, Fortschritt nur auf dem Gerät.

## Einrichten (einmalig, am Handy möglich)
1. `supabase.com` → mit GitHub anmelden → **New project** (Name `azubiquest`, Region **Frankfurt / eu-central-1**).
2. **Authentication → Sign In / Providers → Email:** „Confirm email“ **ausschalten**. „Allow new users to sign up“ an lassen.
3. **SQL Editor → New query:** den Block unten einfügen und **Run**.
4. **Project Settings → API:** *Project URL* und *anon*/*publishable* Key kopieren und in `src/cloud/config.ts` eintragen (oder beim Bauen als `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
   Beide Werte dürfen öffentlich sein. **Nie** den `service_role`-/`secret`-Key oder das Datenbank-Passwort verwenden.

```sql
create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint progress_size check (pg_column_size(data) < 500000)
);
alter table public.progress enable row level security;
create policy "own select" on public.progress for select using (auth.uid() = user_id);
create policy "own insert" on public.progress for insert with check (auth.uid() = user_id);
create policy "own update" on public.progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on public.progress for delete using (auth.uid() = user_id);

create or replace function public.delete_my_account() returns void
language sql security definer set search_path = public, auth as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
```

## So funktioniert es
- **Nutzername → Pseudo-Adresse** `name@nutzer.lerndruck.de` (klein geschrieben). Supabase erlaubt jede Adresse nur einmal – dadurch ist jeder Nutzername **eindeutig** (auch „Max“ = „max“).
  Es werden nie E-Mails verschickt. Erlaubt: a–z, 0–9, `.`, `_`, `-`, 3–20 Zeichen. Passwort mindestens 8 Zeichen.
- **Zugriff:** Row Level Security – jede Person sieht und ändert nur ihre eigene Zeile. Die Zeile ist auf 500 KB begrenzt.
- **Abgleich:** Beim Anmelden und beim Zurückkehren in die App wird der Cloud-Stand geholt und mit dem Gerät zusammengeführt (je Wert der bessere Stand: XP, Abzeichen, Noten, Lernplan, Lektionen …);
  Änderungen werden nach wenigen Sekunden gebündelt hochgeladen. Es wird erst hochgeladen, **nachdem** der Cloud-Stand geholt wurde (kein Überschreiben durch ein leeres Gerät).
  Bei gleichzeitiger Nutzung auf zwei Geräten zählt je Wert der höhere Stand (XP werden nicht addiert). Ein „Zurücksetzen“ im Profil gewinnt gegen ältere Stände anderer Geräte.
- **Bestehender Stand:** Wer schon vor der Einführung gespielt hat, bekommt den Stand dieses Geräts beim ersten Anmelden/Registrieren ins Konto übernommen.
- **Gemeinsam genutztes Handy:** Beim Abmelden wird der Stand vom Gerät entfernt (er bleibt im Konto). Meldet sich ein anderes Konto an, wird nichts vom vorherigen übernommen.
- **Offline:** Angemeldete Personen können offline weiterspielen; hochgeladen wird, sobald wieder Verbindung besteht.
- **Konto löschen:** Profil → Konto → „Konto löschen“ (löscht Konto + gespeicherten Fortschritt).

## Betrieb / Admin
- **Passwort vergessen:** gibt es nicht (keine E-Mail). Zurücksetzen durch dich im SQL Editor:
  ```sql
  update auth.users set encrypted_password = crypt('NEUES-PASSWORT', gen_salt('bf'))
  where email = 'nutzername@nutzer.lerndruck.de';
  ```
- **Kostenloser Tarif:** Projekte ohne Aktivität werden nach etwa einer Woche pausiert (im Supabase-Dashboard mit einem Klick wieder starten). Datenbank-Backups gibt es im kostenlosen Tarif nicht.
- **Missbrauch:** Supabase begrenzt Anmeldeversuche selbst. Bei Spam-Registrierungen: unter *Authentication → Users* Konten löschen, „Allow new users to sign up“ ausschalten oder einen Klassen-Code nachrüsten (sag Bescheid).

## Datenschutz (bitte beachten, ich kann das nicht rechtlich beurteilen)
- Sobald Konten auf einem Server liegen, werden personenbezogene Daten verarbeitet (Nutzername, Anmeldezeitpunkte, Lernfortschritt, IP-Adressen beim Anbieter).
- Mit Supabase sollte ein **Auftragsverarbeitungsvertrag (DPA)** geschlossen werden (im Supabase-Dashboard unter den rechtlichen Dokumenten verfügbar).
- Bei einem öffentlichen Angebot ist ein **Impressum mit Namen und Anschrift** sehr wahrscheinlich nötig, und die Datenschutzerklärung braucht Angaben zum Verantwortlichen.
- Sind **Minderjährige unter 16** dabei, sind ggf. Einwilligungen der Eltern nötig – Schule/Beratung fragen.
