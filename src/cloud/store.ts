import { create } from 'zustand';
import { useProgress } from '@/store/progress';
import { getCloudApi, CloudError, ERROR_TEXT } from './api';
import type { CloudApi } from './api';
import { mergeProgress, parsePayload } from './merge';
import type { SyncPayload, SyncState } from './merge';
import { cloudEnabled } from './config';

const OWNER_KEY = 'azubiquest-cloud-owner';
const PUSH_DELAY_MS = 4000;

type Status = 'init' | 'out' | 'in';
type Sync = 'idle' | 'syncing' | 'ok' | 'error';

interface CloudState {
  status: Status;
  username: string | null;
  sync: Sync;
  lastSync: number | null;
  init: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const snapshot = (): SyncState => {
  const s = useProgress.getState();
  return { byPruefung: s.byPruefung, globalStreak: s.globalStreak, bestGlobalStreak: s.bestGlobalStreak, globalLastDay: s.globalLastDay, globalResetAt: s.globalResetAt };
};
const toPayload = (s: SyncState): SyncPayload => ({ v: 1, ...s });
const readOwner = () => {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
};
const writeOwner = (id: string | null) => {
  try {
    if (id) localStorage.setItem(OWNER_KEY, id);
    else localStorage.removeItem(OWNER_KEY);
  } catch {
    /* egal */
  }
};
const clearLocalProgress = () => useProgress.setState({ byPruefung: {}, globalStreak: 0, bestGlobalStreak: 0, globalLastDay: null, globalResetAt: 0 });

// ---- automatisches Speichern ----
let unsubscribe: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let pulled = false; // erst nach dem ersten erfolgreichen Abgleich wird hochgeladen (sonst könnte ein leeres Gerät die Cloud überschreiben)

function stopAutoPush() {
  unsubscribe?.();
  unsubscribe = null;
  if (timer) clearTimeout(timer);
  timer = null;
  pulled = false;
}

function startAutoPush(api: CloudApi, set: (p: Partial<CloudState>) => void) {
  stopAutoPush();
  unsubscribe = useProgress.subscribe(() => {
    if (!pulled) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        await api.push(toPayload(snapshot()));
        set({ sync: 'ok', lastSync: Date.now() });
      } catch {
        set({ sync: 'error' });
      }
    }, PUSH_DELAY_MS);
  });
}

export const useCloud = create<CloudState>()((set, get) => {
  /** Cloud-Stand holen, mit dem Gerät zusammenführen, Ergebnis speichern und hochladen */
  const runSync = async (api: CloudApi, userId: string) => {
    set({ sync: 'syncing' });
    try {
      const owner = readOwner();
      if (owner && owner !== userId) clearLocalProgress(); // Gerät gehörte einem anderen Konto
      const remote = parsePayload(await api.pull());
      const merged = mergeProgress(snapshot(), remote);
      useProgress.setState(merged);
      writeOwner(userId);
      await api.push(toPayload(merged));
      pulled = true;
      set({ sync: 'ok', lastSync: Date.now() });
    } catch {
      set({ sync: 'error' });
    }
  };

  const enter = async (api: CloudApi, user: { userId: string; username: string }) => {
    set({ status: 'in', username: user.username });
    startAutoPush(api, set);
    await runSync(api, user.userId);
  };

  return {
    status: cloudEnabled ? 'init' : 'out',
    username: null,
    sync: 'idle',
    lastSync: null,

    init: async () => {
      if (!cloudEnabled || get().status !== 'init') return;
      try {
        const api = await getCloudApi();
        const user = await api.getSession();
        if (user) {
          await enter(api, user);
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && get().status === 'in' && pulled) void get().syncNow();
          });
        } else set({ status: 'out' });
      } catch {
        set({ status: 'out' });
      }
    },

    signIn: async (username, password) => {
      const api = await getCloudApi();
      const user = await api.signIn(username, password);
      await enter(api, user);
    },

    signUp: async (username, password) => {
      const api = await getCloudApi();
      const user = await api.signUp(username, password);
      await enter(api, user);
    },

    signOut: async () => {
      const api = await getCloudApi();
      // letzten Stand noch hochladen, dann abmelden und die Daten vom Gerät nehmen (gemeinsam genutzte Handys)
      if (pulled) await api.push(toPayload(snapshot())).catch(() => {});
      stopAutoPush();
      await api.signOut();
      clearLocalProgress();
      writeOwner(null);
      set({ status: 'out', username: null, sync: 'idle' });
    },

    deleteAccount: async () => {
      const api = await getCloudApi();
      stopAutoPush();
      await api.deleteAccount();
      clearLocalProgress();
      writeOwner(null);
      set({ status: 'out', username: null, sync: 'idle' });
    },

    syncNow: async () => {
      const api = await getCloudApi();
      const user = await api.getSession();
      if (user) await runSync(api, user.userId);
    },
  };
});

/** nur für Tests: Zustand und Zeitgeber zurücksetzen */
export function resetCloudForTests(): void {
  stopAutoPush();
  useCloud.setState({ status: cloudEnabled ? 'init' : 'out', username: null, sync: 'idle', lastSync: null });
}

export const cloudErrorText = (e: unknown): string => ERROR_TEXT[e instanceof CloudError ? e.code : 'other'];
