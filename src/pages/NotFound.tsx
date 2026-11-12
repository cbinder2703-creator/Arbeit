import { Link } from 'react-router-dom';
import { Button } from '@/ui/Button';

export function NotFound({ what = 'Diese Seite' }: { what?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-ink">
      <div>
        <div className="font-display text-6xl text-xp">404</div>
        <h1 className="mt-2 text-2xl">{what} gibt es nicht.</h1>
        <p className="mt-2 text-mute">Vielleicht hast du dich vertippt – von hier geht’s zurück.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Zu „Meine Prüfungen“</Button>
        </Link>
      </div>
    </div>
  );
}
