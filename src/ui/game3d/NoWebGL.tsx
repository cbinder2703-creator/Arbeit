import { ModeFrame } from '../ModeFrame';
import { ModeHeader } from '../ModeHeader';
import { Button } from '../Button';

/** Freundlicher Hinweis, wenn das Gerät kein WebGL kann – statt eines Fehlers */
export function NoWebGL({ title, total, score, onClose }: { title: string; total: number; score: number; onClose: () => void }) {
  return (
    <ModeFrame>
      <ModeHeader onClose={onClose} current={0} total={total} score={score} title={title} />
      <div className="grid flex-1 place-items-center px-6 text-center" data-testid="no-webgl">
        <div>
          <h1 className="text-2xl">3D geht auf diesem Gerät nicht</h1>
          <p className="mt-2 text-mute">Dein Browser unterstützt WebGL nicht (oder die Grafikbeschleunigung ist aus). Probier ein 2D-Spiel wie den Lern-Runner oder die Burg-Wacht.</p>
          <Button className="mt-6" onClick={onClose}>Zurück</Button>
        </div>
      </div>
    </ModeFrame>
  );
}
