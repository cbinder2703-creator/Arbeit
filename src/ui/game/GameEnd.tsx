import { ModeFrame } from '../ModeFrame';
import { Confetti } from '../Confetti';
import { Button } from '../Button';
import { Icon } from '../Icon';

/** Abschluss-Bildschirm der Spiele (Sieg mit Konfetti, Niederlage freundlich) */
export function GameEnd({ win, icon, title, text, onDone }: { win: boolean; icon: string; title: string; text: string; onDone: () => void }) {
  return (
    <ModeFrame>
      {win && <Confetti />}
      <div className="grid flex-1 place-items-center px-6 text-center" data-testid="end" data-result={win ? 'win' : 'lose'}>
        <div>
          <span className={`mx-auto grid h-24 w-24 place-items-center rounded-full ${win ? 'bg-good/20 text-good' : 'bg-bad/20 text-bad'}`}>
            <Icon name={icon} size={48} />
          </span>
          <h1 className="mt-4 text-3xl">{title}</h1>
          <p className="mt-2 text-mute">{text}</p>
          <Button className="mt-6" onClick={onDone}>Ergebnis ansehen</Button>
        </div>
      </div>
    </ModeFrame>
  );
}
