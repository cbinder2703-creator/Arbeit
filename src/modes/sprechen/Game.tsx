import { useEffect, useRef, useState } from 'react';
import type { ModeProps } from '../types';
import type { AnswerResult } from '@/engine/scoring';
import { itemText } from '@/engine/describe';
import { similarity } from '@/engine/words';
import { useSettings } from '@/store/settings';
import { ModeFrame } from '@/ui/ModeFrame';
import { ModeHeader } from '@/ui/ModeHeader';
import { FeedbackSheet } from '@/ui/FeedbackSheet';
import { Button } from '@/ui/Button';
import { ChapterChip } from '@/ui/ChapterChip';
import { Icon } from '@/ui/Icon';
import { SpeakButton, useSpeechConfig } from '@/ui/SpeakButton';
import { canRecognize, startRecognition } from '@/ui/speech';
import type { Recognition, RecognitionError } from '@/ui/speech';
import { useFinishLabel } from '@/ui/sequence';
import { playSound } from '@/ui/sound';

const PASS = 0.8; // so viel vom Satz muss erkannt werden
const MAX_TRIES = 3;

const ERRORS: Record<RecognitionError, string> = {
  'not-allowed': 'Das Mikrofon ist nicht erlaubt. Erlaube es in den Browser-Einstellungen – oder übe ohne Mikrofon.',
  'no-speech': 'Ich habe nichts gehört. Sprich direkt nach dem Tippen und nah am Mikrofon.',
  network: 'Die Spracherkennung ist gerade nicht erreichbar. Versuch es nochmal – oder übe ohne Mikrofon.',
  'audio-capture': 'Kein Mikrofon gefunden. Übe ohne Mikrofon oder schließe eins an.',
  unsupported: 'Dein Browser kann das nicht. Übe ohne Mikrofon.',
  other: 'Das hat nicht geklappt. Versuch es nochmal – oder übe ohne Mikrofon.',
};

export default function Game({ items, onAnswer, onFinish, onClose, score }: ModeProps) {
  const finishLabel = useFinishLabel();
  const cfg = useSpeechConfig() ?? { lang: 'en-GB', rate: 0.95 };
  const consent = useSettings((s) => s.speechConsent);
  const [noMic, setNoMic] = useState(false);
  const recognitionPossible = canRecognize();
  const mode: 'auto' | 'consent' | 'self' = recognitionPossible && !noMic ? (consent ? 'auto' : 'consent') : 'self';

  const [idx, setIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [tries, setTries] = useState(0);
  const [last, setLast] = useState<{ heard: string; pct: number } | null>(null);
  const [error, setError] = useState('');
  const [res, setRes] = useState<AnswerResult | null>(null);
  const [ok, setOk] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const start = useRef(Date.now());
  const item = items[idx];
  if (item.type !== 'speak') throw new Error('Sprechen braucht speak-Aufgaben');
  const checked = res !== null;

  useEffect(() => () => rec.current?.stop(), []);

  const finalize = (good: boolean) => {
    const r = onAnswer({ itemId: item.id, correct: good, timeMs: Date.now() - start.current });
    playSound(good ? 'correct' : 'wrong');
    setOk(good);
    setRes(r);
  };

  const listen = async () => {
    if (listening) return rec.current?.stop();
    setError('');
    setLast(null);
    setListening(true);
    const r = startRecognition(cfg.lang);
    rec.current = r;
    try {
      const alts = await r.result;
      if (!alts) {
        setError(ERRORS['no-speech']);
        return;
      }
      const scored = alts.map((a) => ({ heard: a, pct: similarity(item.text, a) })).sort((a, b) => b.pct - a.pct)[0];
      const pct = Math.round(scored.pct * 100);
      if (scored.pct >= PASS) finalize(true);
      else {
        setLast({ heard: scored.heard, pct });
        setTries((t) => t + 1);
        playSound('wrong');
      }
    } catch (e) {
      setError(ERRORS[(e as RecognitionError) in ERRORS ? (e as RecognitionError) : 'other']);
    } finally {
      setListening(false);
    }
  };

  const goNext = () => {
    if (idx + 1 >= items.length) return onFinish({ score: res?.total ?? score, maxScore: items.length * 100 });
    setIdx(idx + 1);
    setRes(null);
    setLast(null);
    setError('');
    setTries(0);
    start.current = Date.now();
  };
  const skip = () => {
    // übersprungen: zählt weder richtig noch falsch
    if (idx + 1 >= items.length) return onFinish({ score, maxScore: items.length * 100 });
    goNext();
  };

  return (
    <ModeFrame padBottom={checked}>
      <ModeHeader onClose={onClose} current={idx + (checked ? 1 : 0)} total={items.length} score={score} title="Sprechen" lookup={itemText(item)} />
      <div className="flex-1 px-4 pb-6">
        <ChapterChip chapter={item.chapter} />
        <h1 className="mt-2 font-display text-[22px] leading-tight">Sprich diesen Satz nach</h1>

        <div className="mt-4 rounded-3xl bg-card p-5" data-testid="sentence">
          <p className="font-display text-[24px] leading-snug">{item.text}</p>
          {item.translation && <p className="mt-2 text-[15px] text-mute">{item.translation}</p>}
          <div className="mt-4 flex gap-2">
            <SpeakButton text={item.text} lang={cfg.lang} label="Satz anhören" className="min-w-[52px]" />
            <SpeakButton text={item.text} lang={cfg.lang} slow />
          </div>
        </div>

        {!checked && mode === 'consent' && (
          <section className="mt-5 rounded-2xl border border-xp/40 bg-xp/10 p-4" aria-label="Zustimmung Spracherkennung">
            <h2 className="font-display text-lg">Mikrofon benutzen?</h2>
            <p className="mt-1 text-[15px] leading-snug">
              Zum Prüfen deiner Aussprache nutzt dein Browser seine Spracherkennung. Dabei wird deine Aufnahme zur Auswertung an den
              Hersteller des Browsers geschickt (z. B. Google oder Apple). AzubiQuest selbst speichert keine Aufnahmen.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button variant="theme" onClick={() => useSettings.getState().set({ speechConsent: true })}>
                Erlauben
              </Button>
              <Button variant="secondary" onClick={() => setNoMic(true)}>
                Ohne Mikrofon üben
              </Button>
            </div>
          </section>
        )}

        {!checked && mode === 'auto' && (
          <div className="mt-6 flex flex-col items-center">
            <button
              onClick={() => void listen()}
              aria-label={listening ? 'Aufnahme beenden' : 'Sprechen'}
              aria-pressed={listening}
              className={`tap grid h-24 w-24 place-items-center rounded-full text-white shadow-lg transition active:scale-95 ${
                listening ? 'animate-pulse bg-bad' : 'bg-p'
              }`}
            >
              <Icon name="mic" size={40} />
            </button>
            <p className="mt-2 text-sm text-mute" role="status">
              {listening ? 'Ich höre zu … sprich jetzt.' : tries > 0 ? 'Nochmal versuchen' : 'Tippen und sprechen'}
            </p>
          </div>
        )}

        {!checked && error && (
          <p role="alert" className="mt-4 rounded-2xl border border-bad/40 bg-bad/10 p-3 text-[15px]">
            {error}
          </p>
        )}

        {!checked && last && (
          <div className="mt-4 rounded-2xl border border-bad/40 bg-card p-4" data-testid="heard" role="status">
            <div className="text-xs text-mute">Ich habe verstanden ({last.pct} %):</div>
            <div className="mt-1 text-[17px] font-semibold">„{last.heard}“</div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {tries < MAX_TRIES && <Button variant="theme" onClick={() => void listen()}>Nochmal sprechen ({MAX_TRIES - tries} Versuche)</Button>}
              <Button variant="secondary" onClick={() => finalize(false)}>Weiter</Button>
            </div>
          </div>
        )}

        {!checked && mode === 'self' && (
          <section className="mt-5" aria-label="Selbst bewerten">
            <p className="text-[15px] text-mute">Sprich den Satz laut. Wie ist es gelaufen?</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button variant="confirm" onClick={() => finalize(true)}>
                <Icon name="check" size={18} /> Gut gesprochen
              </Button>
              <Button variant="secondary" onClick={() => finalize(false)}>
                Noch nicht ganz
              </Button>
            </div>
          </section>
        )}

        {!checked && (
          <button onClick={skip} className="tap mx-auto mt-6 block rounded-xl px-4 text-sm font-semibold text-mute underline underline-offset-4 hover:text-ink">
            Kann gerade nicht sprechen – überspringen
          </button>
        )}
      </div>

      {checked && res && (
        <FeedbackSheet
          correct={ok}
          points={res.points}
          title={ok ? 'Gut gesprochen!' : 'Übe den Satz nochmal'}
          text={`„${item.text}“${item.translation ? ` – ${item.translation}` : ''}`}
          nextLabel={idx + 1 >= items.length ? finishLabel : 'Weiter'}
          onNext={goNext}
        />
      )}
    </ModeFrame>
  );
}
