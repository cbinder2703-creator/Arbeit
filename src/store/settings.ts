import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  sound: boolean;
  /** Entspannt-Modus: kein Zeitdruck im Quiz-Blitz */
  relaxed: boolean;
  /** Blitz-Modus bei „Wahr oder Falsch?“ (60-Sekunden-Timer) */
  blitz: boolean;
  set: (patch: Partial<Omit<SettingsState, 'set'>>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      sound: true,
      relaxed: false,
      blitz: false,
      set: (patch) => set(patch),
    }),
    { name: 'azubiquest-settings', version: 1 },
  ),
);
