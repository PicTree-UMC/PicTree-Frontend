import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pictree: {
          50: '#f4fbef',
          100: '#e5f7d9',
          500: '#8bcf5d',
          700: '#4f8d34',
        },
      },
      // 막힌 동작을 알릴 때 쓰는 짧은 좌우 흔들림.
      // 진폭이 작으면 안 보인다 — 특히 방금 나타난 요소는 흔들려도 등장으로 읽힌다.
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '15%, 45%, 75%': { transform: 'translateX(-6px)' },
          '30%, 60%, 90%': { transform: 'translateX(6px)' },
        },
      },
      animation: {
        shake: 'shake 0.45s ease-in-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
