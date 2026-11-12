export function ProgressRing({
  percent,
  size = 44,
  color = '#3B82F6',
  stroke = 5,
  label,
}: {
  percent: number;
  size?: number;
  color?: string;
  stroke?: number;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${p} Prozent`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A3352" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          style={{ transition: 'stroke-dashoffset 300ms ease-out' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-bold">{label ?? `${p}%`}</span>
    </div>
  );
}
