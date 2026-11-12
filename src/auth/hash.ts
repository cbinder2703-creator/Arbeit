// Gemeinsamer Login (ein Nutzername + ein Passwort für alle). Es wird nie ein Passwort gespeichert, sondern nur eine
// gesalzene PBKDF2-Prüfsumme, die beim Bauen der Seite berechnet wird. Läuft im Browser und in Node (WebCrypto).
export interface AuthConfig {
  salt: string; // hex
  iter: number;
  hash: string; // hex
}

const enc = new TextEncoder();
const toHex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b instanceof Uint8Array ? b : b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const fromHex = (h: string) => new Uint8Array((h.match(/../g) ?? []).map((x) => parseInt(x, 16)));

/** Nutzername: Groß-/Kleinschreibung und Leerzeichen am Rand egal; Passwort: exakt */
export const normUser = (u: string) => u.trim().toLowerCase();

export async function derive(user: string, pass: string, saltHex: string, iter: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(`${normUser(user)}\u0000${pass}`), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: iter }, key, 256);
  return toHex(bits);
}

export async function makeAuthConfig(user: string, pass: string, iter = 210_000): Promise<AuthConfig> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return { salt, iter, hash: await derive(user, pass, salt, iter) };
}

export async function checkLogin(cfg: AuthConfig, user: string, pass: string): Promise<boolean> {
  const h = await derive(user, pass, cfg.salt, cfg.iter);
  // Vergleich ohne frühen Abbruch
  let diff = h.length ^ cfg.hash.length;
  for (let i = 0; i < Math.max(h.length, cfg.hash.length); i++) diff |= (h.charCodeAt(i) || 0) ^ (cfg.hash.charCodeAt(i) || 0);
  return diff === 0;
}
