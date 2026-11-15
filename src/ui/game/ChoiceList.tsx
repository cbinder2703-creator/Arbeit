import { CHOICE_COLORS, LETTERS } from './colors';

interface Props {
  choices: string[];
  onPick: (i: number) => void;
  /** aktuell gewählte (noch nicht aufgelöste) Antwort, z. B. die Spur, in der man gerade fährt */
  selected?: number | null;
  /** nach der Antwort: gewählte und richtige zeigen */
  picked?: number | null;
  correct?: number;
  disabled?: boolean;
}

/** Antwort-Knöpfe mit Farbe + Buchstabe (A–D); Zahlentasten 1–4 gehören dem Spiel, nicht dieser Liste */
export function ChoiceList({ choices, onPick, selected = null, picked = null, correct, disabled }: Props) {
  return (
    <div className="grid gap-2 md:grid-cols-2" role="group" aria-label="Antworten">
      {choices.map((c, i) => {
        const state = picked === null ? (selected === i ? 'selected' : 'idle') : i === correct ? 'right' : i === picked ? 'wrong' : 'dim';
        return (
          <button
            key={i}
            onClick={() => onPick(i)}
            disabled={disabled}
            data-state={state}
            data-choice={i}
            className={`tap flex min-h-[52px] items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left text-[14px] leading-snug transition ${
              state === 'right' ? 'border-good bg-good/15' : state === 'wrong' ? 'animate-wiggle border-bad bg-bad/15' : state === 'dim' ? 'border-line bg-card opacity-50' : state === 'selected' ? 'bg-card-hi' : 'border-line bg-card'
            }`}
            style={state === 'selected' ? { borderColor: CHOICE_COLORS[i] } : undefined}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold text-bg" style={{ background: CHOICE_COLORS[i] }}>
              {LETTERS[i]}
            </span>
            <span className="flex-1">{c}</span>
          </button>
        );
      })}
    </div>
  );
}
