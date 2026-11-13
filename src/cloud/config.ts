// Konten & Fortschritt in der Cloud (Supabase). Beide Werte dürfen öffentlich sein (Projekt-URL und „publishable“/„anon“-Schlüssel);
// geschützt wird über Zugriffsregeln in der Datenbank (Row Level Security, siehe docs/SUPABASE.md).
// Zum Ausschalten (z. B. lokal): VITE_CLOUD=off  – dann gibt es keine Konten, der Fortschritt bleibt nur auf dem Gerät.
export const SUPABASE_URL: string = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || 'https://mewwvahklloqnbbwygvw.supabase.co';
export const SUPABASE_KEY: string = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || 'sb_publishable_9SBZId48fGhz93y_LaG7sg_KtPZHsGN';

export const cloudEnabled: boolean = import.meta.env.VITE_CLOUD !== 'off' && SUPABASE_URL.startsWith('https://') && SUPABASE_KEY.length > 20;
