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
      // 막힌 동작을 알릴 때 쓰는 짧은 좌우 흔들림. 문구만 새로 뜨면 이미 떠 있을 때
      // 다시 눌러도 변화가 없어서, 눌렸다는 신호가 필요하다.
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
