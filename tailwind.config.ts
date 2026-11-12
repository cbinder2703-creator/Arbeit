import type { Config } from 'tailwindcss';
import { colors } from './src/ui/theme';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: colors.bg,
        card: colors.card,
        'card-hi': colors.cardHigh,
        line: colors.line,
        ink: colors.text,
        mute: colors.textMute,
        xp: colors.xp,
        good: colors.good,
        bad: colors.bad,
        // Prüfungs-Thema (per CSS-Variablen aus pruefung.json)
        p: 'rgb(var(--p-rgb) / <alpha-value>)',
        'p-accent': 'rgb(var(--p-accent-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Nunito', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '20px', xl3: '24px' },
      keyframes: {
        wiggle: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(7px)' },
          '60%': { transform: 'translateX(-5px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
      },
      animation: {
        wiggle: 'wiggle 280ms ease-out',
        sheet: 'sheet 240ms cubic-bezier(.2,.9,.3,1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
