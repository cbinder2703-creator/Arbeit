import { useSettings } from '@/store/settings';

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="tap flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-card p-4">
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-xs text-mute">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-line transition checked:bg-good relative before:absolute before:left-1 before:top-1 before:h-5 before:w-5 before:rounded-full before:bg-white before:transition checked:before:translate-x-5"
      />
    </label>
  );
}

export function Settings() {
  const s = useSettings();
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Toggle label="Sound" hint="Kleine Effekte bei richtig/falsch" checked={s.sound} onChange={(v) => s.set({ sound: v })} />
      <Toggle label="Entspannt-Modus" hint="Quiz-Blitz ohne Zeitdruck (kein Zeitbonus)" checked={s.relaxed} onChange={(v) => s.set({ relaxed: v })} />
      <Toggle label="Blitz-Modus" hint="Wahr oder Falsch? mit 60-Sekunden-Timer" checked={s.blitz} onChange={(v) => s.set({ blitz: v })} />
    </div>
  );
}
