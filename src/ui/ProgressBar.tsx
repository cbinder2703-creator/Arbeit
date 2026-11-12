export function ProgressBar({
  percent,
  color = 'rgb(var(--p-accent-rgb))',
  className = '',
  height = 8,
}: {
  percent: number;
  color?: string;
  className?: string;
  height?: number;
}) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-line ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(p)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full" style={{ width: `${p}%`, background: color, transition: 'width 300ms ease-out' }} />
    </div>
  );
}
