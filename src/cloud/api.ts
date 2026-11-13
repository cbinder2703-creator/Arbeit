// Schnittstelle zur Cloud. Die echte Umsetzung nutzt Supabase (wird erst bei Bedarf nachgeladen); Tests setzen eine Attrappe ein.
import { SUPABASE_KEY, SUPABASE_URL } from './config';
import { emailToUsername, usernameToEmail } from './username';
import type { SyncPayload } from './merge';

export type CloudErrorCode = 'exists' | 'credentials' | 'rate' | 'network' | 'confirm' | 'weak' | 'other';

export class CloudError extends Error {
  constructor(public code: CloudErrorCode, message?: string) {
    super(message ?? code);
  }
}

export const ERROR_TEXT: Record<CloudErrorCode, string> = {
  exists: 'Diesen Nutzernamen gibt es schon. Nimm einen anderen – oder melde dich an.',
  credentials: 'Nutzername oder Passwort stimmt nicht.',
  rate: 'Zu viele Versuche. Warte eine Minute und versuch es nochmal.',
  network: 'Keine Verbindung zum Server. Prüfe dein Internet und versuch es nochmal.',
  confirm: 'Die Registrierung ist noch nicht freigeschaltet (Einstellung „Confirm email“ bei Supabase ist noch an).',
  weak: 'Das Passwort ist zu einfach oder zu kurz.',
  other: 'Das hat nicht geklappt. Versuch es später nochmal.',
};

export interface CloudUser {
  userId: string;
  username: string;
}

export interface CloudApi {
  getSession(): Promise<CloudUser | null>;
  signUp(username: string, password: string): Promise<CloudUser>;
  signIn(username: string, password: string): Promise<CloudUser>;
  signOut(): Promise<void>;
  /** `null` = in der Cloud ist noch nichts gespeichert */
  pull(): Promise<unknown | null>;
  push(data: SyncPayload): Promise<void>;
  deleteAccount(): Promise<void>;
}

let api: CloudApi | null = null;
export const setCloudApi = (a: CloudApi | null): void => {
  api = a;
};

function mapError(e: unknown): CloudError {
  if (e instanceof CloudError) return e;
  const err = e as { message?: string; status?: number; code?: string; name?: string };
  const msg = (err?.message ?? '').toLowerCase();
  if (err?.code === 'user_already_exists' || msg.includes('already registered') || msg.includes('already been registered')) return new CloudError('exists');
  if (err?.code === 'invalid_credentials' || msg.includes('invalid login')) return new CloudError('credentials');
  if (err?.status === 429 || msg.includes('rate limit') || msg.includes('too many')) return new CloudError('rate');
  if (err?.code === 'weak_password' || msg.includes('password should') || msg.includes('weak')) return new CloudError('weak');
  if (msg.includes('email not confirmed') || err?.code === 'email_not_confirmed') return new CloudError('confirm');
  if (msg.includes('fetch') || msg.includes('network') || err?.name === 'AuthRetryableFetchError' || err?.status === 0) return new CloudError('network');
  return new CloudError('other', err?.message);
}

async function supabaseApi(): Promise<CloudApi> {
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'azubiquest-cloud-auth' },
  });
  const toUser = (u: { id: string; email?: string | null }): CloudUser => ({ userId: u.id, username: emailToUsername(u.email ?? '') });
  const uid = async (): Promise<string> => {
    const { data } = await sb.auth.getSession();
    if (!data.session) throw new CloudError('credentials');
    return data.session.user.id;
  };
  return {
    async getSession() {
      const { data } = await sb.auth.getSession();
      return data.session ? toUser(data.session.user) : null;
    },
    async signUp(username, password) {
      const { data, error } = await sb.auth.signUp({ email: usernameToEmail(username), password });
      if (error) throw mapError(error);
      if (!data.session || !data.user) {
        // „Confirm email“ ist bei Supabase noch an, oder der Name ist schon vergeben (Supabase meldet das dann ohne Fehler)
        throw new CloudError(data.user && data.user.identities?.length === 0 ? 'exists' : 'confirm');
      }
      return toUser(data.user);
    },
    async signIn(username, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email: usernameToEmail(username), password });
      if (error) throw mapError(error);
      return toUser(data.user);
    },
    async signOut() {
      await sb.auth.signOut({ scope: 'local' });
    },
    async pull() {
      const id = await uid();
      const { data, error } = await sb.from('progress').select('data').eq('user_id', id).maybeSingle();
      if (error) throw mapError(error);
      return data?.data ?? null;
    },
    async push(data) {
      const id = await uid();
      const { error } = await sb.from('progress').upsert({ user_id: id, data, updated_at: new Date().toISOString() });
      if (error) throw mapError(error);
    },
    async deleteAccount() {
      const { error } = await sb.rpc('delete_my_account');
      if (error) throw mapError(error);
      await sb.auth.signOut({ scope: 'local' });
    },
  };
}

/** Wrapper: wirft immer CloudError (verständlich), auch bei Netzwerkfehlern */
export async function getCloudApi(): Promise<CloudApi> {
  if (!api) api = await supabaseApi();
  const a = api;
  const wrap = <A extends unknown[], R>(fn: (...args: A) => Promise<R>) => async (...args: A): Promise<R> => {
    try {
      return await fn(...args);
    } catch (e) {
      throw mapError(e);
    }
  };
  return {
    getSession: wrap(a.getSession.bind(a)),
    signUp: wrap(a.signUp.bind(a)),
    signIn: wrap(a.signIn.bind(a)),
    signOut: wrap(a.signOut.bind(a)),
    pull: wrap(a.pull.bind(a)),
    push: wrap(a.push.bind(a)),
    deleteAccount: wrap(a.deleteAccount.bind(a)),
  };
}
