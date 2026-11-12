import type { ReactNode } from 'react';

export function Chip({ children, color, className = '' }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ${className}`}
      style={color ? { color, background: `${color}26` } : undefined}
    >
      {children}
    </span>
  );
}
