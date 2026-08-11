import type { ReactNode } from 'react';

/**
 * 화면에 보여줄 것이 하나도 없을 때의 자리 — 그림 + 제목 + 설명 + (선택) 다음 행동.
 *
 * ⚠️ **얼개와 간격만 모은다. 그림은 화면마다 다르다.** 타임라인은 새싹, 동선은 경로
 * 그리기, 블로그는 책장 넘김이고 그건 의도된 차이다. 여기서 통일하는 것은 **어느 높이에서
 * 글이 시작하는가** 다 — 탭을 옮길 때마다 그 높이가 달라 화면이 흔들려 보였다(이슈 #274).
 *
 * 모으기 전에 갈라져 있던 값들:
 *
 * | | 타임라인 | 동선 | 블로그 |
 * | --- | --- | --- | --- |
 * | 세로 정렬 | 가운데 | 가운데 | **`pt-[24vh]`** (기기 높이 따라 이동) |
 * | 제목 위 | `mt-6` | `mt-6` | `mt-5` |
 * | CTA 위 | `mt-7` | `mt-8` | — |
 * | CTA 글자색 | `text-cream` | **`text-white`** | — |
 * | 좌우 여백 | `px-4` | `px-4` | `px-8` |
 */
interface EmptyStateProps {
  /**
   * 그림. **크기와 자체 애니메이션은 넘기는 쪽이 갖는다** — 새싹 164px, 경로 200px 처럼
   * 그림마다 알맞은 크기가 다르고, 여기서 폭을 강제하면 그림이 찌그러진다.
   *
   * 다만 **세로로는 164px 자리 안에 들어와야 한다**(아래 주석 참고). 넘치면 아래로 삐져나가
   * 제목을 밀어낸다.
   */
  illustration: ReactNode;
  title: string;
  /** 줄바꿈(`<br />`)을 쓰는 화면이 있어 문자열이 아니라 노드로 받는다. */
  description: ReactNode;
  /** 다음 행동. 없는 화면도 있다 — 블로그는 우하단 FAB 이 그 일을 한다. */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * 글이 떠오르기 시작하는 시점(ms).
   *
   * ⚠️ **화면마다 달라야 한다.** 그림이 다 그려질 즈음 글이 떠야 이야기 순서가 맞는데,
   * 그림 길이가 제각각이다 — 새싹은 짧고(150) 경로 그리기는 1.3초쯤 걸린다(600).
   * 여기를 하나로 고정하면 어떤 화면은 글이 그림보다 먼저 뜬다.
   */
  revealDelay?: number;
}

/** 글과 버튼 사이의 시차. 앞서 세 화면이 우연히 모두 150ms 였다 — 그 리듬을 규칙으로 굳힌다. */
const ACTION_STAGGER_MS = 150;

export function EmptyState({
  illustration,
  title,
  description,
  action,
  revealDelay = 150,
}: EmptyStateProps) {
  return (
    /*
      `flex-1` + `justify-center` — 남은 높이의 가운데다. `vh` 로 위에서부터 재면 기기
      높이에 따라 자리가 달라진다(블로그가 그랬다).

      ⚠️ 이 컴포넌트가 `flex-1` 을 가지므로 **감싸는 쪽도 `flex` 컬럼이어야** 한다.
      아니면 높이를 못 받아 내용 높이만큼만 차지하고 위로 붙는다.
    */
    <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
      {/*
        ⚠️ **그림 자리는 높이를 고정한다.** 그림마다 실제 높이가 달라(새싹 157 · 경로 150 ·
        책 120) 그대로 두면 블록 전체가 가운데 서면서 제목 높이가 그림 크기에 끌려다닌다.
        아래를 맞춰(`items-end`) 그림이 어디서 끝나든 **글이 시작하는 높이는 같게** 둔다.
      */}
      <div className="flex h-[164px] items-end justify-center">{illustration}</div>

      <h2
        className="animate-fade-in-up mt-6 text-[17px] font-medium text-ink"
        style={{ animationDelay: `${revealDelay}ms` }}
      >
        {title}
      </h2>

      {/* 제목과 같은 시점에 뜬다 — 한 문단으로 읽히는 두 줄이라 시차를 두면 끊겨 보인다. */}
      <p
        className="animate-fade-in-up mt-2 text-[15px] leading-6 text-ink-muted"
        style={{ animationDelay: `${revealDelay}ms` }}
      >
        {description}
      </p>

      {/*
        ⚠️ **버튼이 없어도 자리는 비워 둔다.** 블록 전체가 가운데 서므로, 버튼 유무로 블록
        높이가 74px 달라지면 그만큼 위 글이 오르내린다 — 버튼이 없는 블로그 탭만 제목이
        37px 높이 떠 있었다.
      */}
      <div className="mt-7 h-[46px]">
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            /*
              글자색은 `text-cream` 이다. 한때 화면마다 `text-cream`·`text-white` 로 갈려
              있었는데, 토큰 정의가 "다크 버튼 위 반전 텍스트도 이 값" 이라고 못 박고 있다
              (`tailwind.config.ts` 의 cream).
            */
            className="animate-fade-in-up h-full rounded-[24px] bg-pictree-700 px-7 text-[15px] font-medium text-cream"
            style={{ animationDelay: `${revealDelay + ACTION_STAGGER_MS}ms` }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
