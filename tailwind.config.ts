import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    /*
      ⚠️ `extend` 가 아니라 통째로 대체한다 — 이게 요점이다.
      `extend` 로는 값을 덮어쓸 수만 있고 **키를 없앨 수는 없어서** `text-sm` 이
      계속 유효한 클래스로 남는다.

      없애는 게 목적인 이유(이슈 #184): Tailwind 기본 스케일은 12/14/16 이라
      design-guidelines §2 의 13/15 기준과 애초에 어긋난다. 그런데 `text-sm` 은
      클래스 이름에 숫자가 안 적혀 있어서, 이 자리가 14px 이라는 걸 리뷰에서
      아무도 못 봤다 — profile 은 타이포 정합을 세 번 거치고도 14px 이 20건
      남아 있었다. 값이 안 보이는 이름은 규칙을 못 지킨다.

      이제 `text-sm`/`text-xs` 는 CSS 를 아예 안 만든다. 잘못 쓰면 글자 크기가
      상속되어 눈에 띄고, 에디터에서도 미지정 클래스로 뜬다.

      2xl 이상도 뺐다. 지금 쓰는 곳이 없고, §2 가 "더 큰 값은 시안 근거가 있을
      때만" 이라 새로 필요해지면 여기에 근거와 함께 추가하는 편이 맞다.
      base/lg/xl/4xl 은 쓰는 곳이 있어 남기되 **Tailwind 기본값 그대로** 적었다
      (특히 lg 의 행간은 1.75rem 이다 — 눈대중으로 줄이면 5곳이 조용히 움직인다).

      13/15 는 이름을 만들어 두기만 했다. 코드 252곳은 여전히 `text-[13px]`·
      `text-[15px]` 를 쓰고 있고 그게 지금의 정본이다. 두 표기를 하나로 합치는
      건 M4 타이포 정리에서 한다 — 여기서 같이 하면 이 커밋의 요점이 252줄
      치환에 묻힌다.
    */
    fontSize: {
      13: ['13px', { lineHeight: '18px' }], // 최소값. 캡션·메타·보조 액션
      15: ['15px', { lineHeight: '22px' }], // 본문
      base: ['1rem', { lineHeight: '1.5rem' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    },
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
        /*
          LINE — 선·구분면 회색 2단계. GREEN 과 같은 이유로 토큰화한다: 값이 하나뿐이면
          눈대중 변형이 안 생긴다. 실제로 토큰이 없던 동안 #E6E6E6·#E5E5E5·#E2E2E2·#EDEDED·
          #E4E5E6·#D4D4D4 여섯 종이 따로 자랐고, 이 pass 에서 전부 아래 둘로 접었다.

          ⚠️ 둘을 하나로 합치지 않는다 — 역할이 다르다.
          · DEFAULT #D9D9D9 는 **경계를 보여주는** 보더(입력창·비활성 버튼·카드 테두리).
          · soft   #ECECEC 는 **덩어리를 나누기만 하는** 옅은 디바이더(목록 사이 줄).
          soft 를 DEFAULT 로 올리면 디바이더 35곳이 전부 보더만큼 진해져 목록이 표처럼 읽힌다.

          ⚠️ 여기 없는 진한 회색은 LINE 이 아니다. TermsAgreementView 의 미체크 원
          테두리(#9B9B9B)가 그런 자리다 — 흰 면 위 비텍스트 UI 는 3:1 이 필요한데
          #D9D9D9 는 1.4:1 이라 못 쓴다. 대비가 필요한 선은 LINE 으로 접지 않는다.
        */
        line: {
          DEFAULT: '#D9D9D9', // LINE (보더)
          soft: '#ECECEC', // LINE-soft (옅은 디바이더)
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
