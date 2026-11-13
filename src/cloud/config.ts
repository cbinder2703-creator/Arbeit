// Konten & Fortschritt in der Cloud (Supabase). Beide Werte dürfen öffentlich sein (Projekt-URL und „anon“/„publishable“-Schlüssel);
// geschützt wird über Zugriffsregeln in der Datenbank (Row Level Security, siehe docs/SUPABASE.md).
// Leer lassen = keine Konten, Fortschritt bleibt nur auf dem Gerät.
export const SUPABASE_URL: string = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
export const SUPABASE_KEY: string = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

export const cloudEnabled: boolean = SUPABASE_URL.startsWith('https://') && SUPABASE_KEY.length > 20;
