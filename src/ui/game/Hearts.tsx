import { Icon } from '../Icon';

export function Hearts({ lives, max, testId = 'hearts' }: { lives: number; max: number; testId?: string }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${lives} von ${max} Herzen`} data-testid={testId}>
      {Array.from({ length: max }, (_, i) => (
        <Icon key={i} name="heart" size={18} className={i < lives ? 'fill-bad text-bad' : 'text-line'} />
      ))}
    </span>
  );
}
