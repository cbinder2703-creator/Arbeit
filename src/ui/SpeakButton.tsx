import { useEffect, useState } from 'react';
import { useOptionalPruefung } from '@/app/pruefungContext';
import { Icon } from './Icon';
import { canSpeak, speak } from './speech';

/** Sprache/Tempo der Prüfung (pruefung.json → speech); ohne Eintrag gibt es kein Vorlesen */
export function useSpeechConfig(): { lang: string; rate: number } | null {
  const s = useOptionalPruefung()?.meta.speech;
  return s ? { lang: s.lang, rate: s.rate } : null;
}

/** 🔊-Knopf: liest den Text vor (nur wenn das Gerät es kann und die Prüfung eine Sprache hat) */
export function SpeakButton({
  text,
  slow = false,
  label,
  className = '',
  lang,
}: {
  text: string;
  slow?: boolean;
  label?: string;
  className?: string;
  /** Sprache erzwingen (z. B. in Tests oder ohne Prüfungs-Kontext) */
  lang?: string;
}) {
  const cfg = useSpeechConfig();
  const [ok, setOk] = useState(() => canSpeak());
  useEffect(() => {
    // Stimmen werden auf manchen Geräten erst nach dem Laden gemeldet
    if (!canSpeak()) return;
    const on = () => setOk(true);
    window.speechSynthesis.addEventListener?.('voiceschanged', on);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', on);
  }, []);
  if (!ok || (!cfg && !lang)) return null;
  const l = lang ?? cfg!.lang;
  const rate = (cfg?.rate ?? 0.95) * (slow ? 0.6 : 1);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, { lang: l, rate });
      }}
      aria-label={label ?? (slow ? 'Langsam vorlesen' : 'Vorlesen')}
      className={`tap inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-p/20 px-3 text-sm font-bold text-p-accent hover:bg-p/30 ${className}`}
    >
      <Icon name={slow ? 'turtle' : 'volume'} size={20} />
      {slow ? 'Langsam' : null}
    </button>
  );
}
