import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'confirm' | 'secondary' | 'theme' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-xp text-[#1a1400] hover:brightness-105',
  confirm: 'bg-good text-[#04210f] hover:brightness-105',
  secondary: 'bg-card-hi text-ink border border-line hover:bg-line/60',
  theme: 'bg-p text-white hover:brightness-110',
  ghost: 'bg-transparent text-mute hover:text-ink hover:bg-card-hi',
  danger: 'bg-bad/15 text-bad border border-bad/40 hover:bg-bad/25',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', block, className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`tap inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold text-[15px] transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
});
