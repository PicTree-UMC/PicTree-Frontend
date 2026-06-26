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
    },
  },
  plugins: [],
} satisfies Config;
