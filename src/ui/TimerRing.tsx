export function TimerRing({ remainingMs, totalMs, size = 56 }: { remainingMs: number; totalMs: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, remainingMs / totalMs));
  const secs = Math.ceil(Math.max(0, remainingMs) / 1000);
  const low = secs <= 5;
  return (
    <div className="relative" style={{ width: size, height: size }} role="timer" aria-label={`${secs} Sekunden übrig`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2A3352" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={low ? '#EF4444' : '#FACC15'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - f)}
        />
      </svg>
      <span className={`absolute inset-0 grid place-items-center font-display text-lg ${low ? 'text-bad' : 'text-xp'}`}>{secs}</span>
    </div>
  );
}
