// Kleine eigene Effekte per WebAudio – keine Dateien, kein Download. Stummschaltbar in den Einstellungen.
import { useSettings } from '@/store/settings';

export type SoundName = 'correct' | 'wrong' | 'hammer' | 'win' | 'flip' | 'tap';

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, to?: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + start);
  if (to) o.frequency.exponentialRampToValueAtTime(to, c.currentTime + start + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export function playSound(name: SoundName): void {
  if (!useSettings.getState().sound) return;
  const c = ac();
  if (!c) return;
  switch (name) {
    case 'correct': // „Pling“
      tone(c, 880, 0, 0.18, 'sine', 0.14);
      tone(c, 1320, 0.08, 0.28, 'sine', 0.12);
      break;
    case 'wrong':
      tone(c, 220, 0, 0.28, 'sawtooth', 0.08, 140);
      break;
    case 'hammer':
      tone(c, 140, 0, 0.12, 'square', 0.16, 60);
      tone(c, 90, 0.02, 0.2, 'triangle', 0.18, 50);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(c, f, i * 0.11, 0.3, 'triangle', 0.12));
      break;
    case 'flip':
      tone(c, 500, 0, 0.07, 'triangle', 0.06, 760);
      break;
    case 'tap':
      tone(c, 600, 0, 0.05, 'sine', 0.05);
      break;
  }
}
