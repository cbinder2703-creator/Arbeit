// Anmeldung per Nutzername statt E-Mail: Der Nutzername wird intern auf eine Pseudo-Adresse abgebildet (es werden nie E-Mails verschickt).
export const USERNAME_DOMAIN = 'nutzer.lerndruck.de';
export const MIN_PASSWORD = 8;

/** Kleinschreibung, Leerzeichen am Rand weg */
export const normalizeUsername = (u: string): string => u.trim().toLowerCase();

/** Fehlermeldung (Deutsch) oder `null`, wenn der Nutzername gültig ist */
export function usernameError(raw: string): string | null {
  const u = normalizeUsername(raw);
  if (u.length < 3) return 'Der Nutzername braucht mindestens 3 Zeichen.';
  if (u.length > 20) return 'Der Nutzername darf höchstens 20 Zeichen haben.';
  if (!/^[a-z0-9._-]+$/.test(u)) return 'Erlaubt sind nur Buchstaben (ohne Umlaute), Zahlen, Punkt, Strich und Unterstrich.';
  if (/^[._-]|[._-]$/.test(u)) return 'Der Nutzername darf nicht mit einem Sonderzeichen beginnen oder enden.';
  return null;
}

export const passwordError = (p: string): string | null =>
  p.length < MIN_PASSWORD ? `Das Passwort braucht mindestens ${MIN_PASSWORD} Zeichen.` : p.length > 72 ? 'Das Passwort darf höchstens 72 Zeichen haben.' : null;

export const usernameToEmail = (u: string): string => `${normalizeUsername(u)}@${USERNAME_DOMAIN}`;
export const emailToUsername = (email: string): string => email.split('@')[0] ?? email;
