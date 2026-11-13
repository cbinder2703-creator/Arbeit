// Vorlesen (Sprachausgabe) und Sprechen (Spracherkennung) über die Funktionen des Browsers/Handys.
// Vorlesen läuft komplett auf dem Gerät. Spracherkennung schickt die Aufnahme je nach Browser an den Hersteller
// (Google/Apple) – deshalb nur nach ausdrücklicher Zustimmung (siehe Modus „Sprechen“).

export const canSpeak = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const primary = lang.split('-')[0].toLowerCase();
  return (
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase() && v.localService) ??
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(primary))
  );
}

export function stopSpeaking(): void {
  if (canSpeak()) window.speechSynthesis.cancel();
}

export function speak(text: string, opts: { lang?: string; rate?: number } = {}): void {
  if (!canSpeak() || !text.trim()) return;
  const lang = opts.lang ?? 'en-GB';
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = opts.rate ?? 0.95;
  const v = pickVoice(lang);
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

// ---------- Spracherkennung ----------
interface RecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }>>;
}
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => RecognitionLike;

const ctor = (): RecognitionCtor | undefined => {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export const canRecognize = (): boolean => !!ctor();

export type RecognitionError = 'not-allowed' | 'no-speech' | 'network' | 'audio-capture' | 'unsupported' | 'other';

export interface Recognition {
  /** Erkannte Texte (beste zuerst) oder `null`, wenn nichts erkannt wurde */
  result: Promise<string[] | null>;
  stop: () => void;
}

/** Startet eine Aufnahme; `result` wird abgelehnt mit einem RecognitionError */
export function startRecognition(lang = 'en-GB'): Recognition {
  const R = ctor();
  if (!R) return { result: Promise.reject<string[] | null>('unsupported' as RecognitionError), stop: () => {} };
  const r = new R();
  r.lang = lang;
  r.interimResults = false;
  r.continuous = false;
  r.maxAlternatives = 3;
  let got: string[] | null = null;
  const result = new Promise<string[] | null>((resolve, reject) => {
    r.onresult = (e) => {
      const alts = Array.from(e.results[0] ?? []).map((a) => a.transcript);
      got = alts.length ? alts : null;
    };
    r.onerror = (e) => {
      const known: RecognitionError[] = ['not-allowed', 'no-speech', 'network', 'audio-capture'];
      reject((known as string[]).includes(e.error) ? (e.error as RecognitionError) : ('other' as RecognitionError));
    };
    r.onend = () => resolve(got);
  });
  try {
    r.start();
  } catch {
    return { result: Promise.reject<string[] | null>('other' as RecognitionError), stop: () => {} };
  }
  return { result, stop: () => r.stop() };
}
