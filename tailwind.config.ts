import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /*
          초기 세팅 때 들어온 라임그린 3종(#e5f7d9 / #8bcf5d / #4f8d34)을 앱이 실제로 쓰는
          팔레트(docs/design-guidelines.md)로 맞춘 값. 당시(PR #147) 쓰는 쪽이 6곳뿐이라
          이름은 그대로 두고 값만 바꿨다 — 클래스를 하나씩 갈아끼우면 옮기다 만 곳이 남는다.

          바뀐 것: 흰 글자를 얹는 700 이 #4f8d34(4.05:1, 본문 기준 4.5:1 미달) → #5B6B38(5.8:1).
          ⚠️ 500 은 휘도 천장이 3.5:1 이라 **흰 글자를 얹으면 안 된다** — 면·테두리·데코 전용.

          이후 이슈 #58 토큰화 pass 에서 프로필을 뺀 전 화면의 GREEN hex 리터럴을
          `bg-pictree-700` 형태로 옮겨 붙여, 쓰는 쪽이 100곳 이상으로 늘었다.
        */
        pictree: {
          100: '#ECF6D8', // GREEN-100
          300: '#C5D89D', // GREEN-300 (연초록 패널·칩. 다크 텍스트 7.9:1)
          500: '#788F4A', // GREEN-500 (면·테두리 전용)
          700: '#5B6B38', // GREEN-700 (흰 글자를 얹는 초록)
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
