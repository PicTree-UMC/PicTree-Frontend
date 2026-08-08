import type { ReactNode } from "react";

/**
 * 메인 탭의 '미리보기' 카드 껍데기 — 여행 캘린더와 즐겨찾기 장소가 나눠 쓴다.
 *
 * **카드 전체가 버튼이다.** 제목 옆 화살표만 누르게 두면 실제로 눈이 가는 것(잔디 격자·
 * 사진 줄)은 죽은 그림이 된다. 안에 들어가는 내용은 전부 읽기 전용이라 버튼 안에 중첩
 * 인터랙티브 요소가 생기지 않는다 — ⚠️ 안쪽에 버튼·링크를 넣을 일이 생기면 이 껍데기를
 * 쓰면 안 된다(중첩 button 은 유효하지 않은 마크업이다).
 *
 * 껍데기 값(`rounded-xl` · 1px `#ECECEC` · 흰 면)은 `SettingsList`·`StatTile` 과 같다.
 * 같은 크림 바닥에 놓이는 흰 면이라 한쪽만 다르면 카드가 서로 다른 높이에 떠 보인다.
 */
export function PreviewCard({
  title,
  meta,
  ariaLabel,
  onClick,
  children,
}: {
  title: string;
  /** 제목 오른쪽 회색 값 (`2026년 8월` · `12곳` 꼴). */
  meta?: ReactNode;
  /** 카드가 무엇을 여는지. 안쪽 글이 길어 버튼 이름이 통째로 읽히면 곤란하다. */
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-full rounded-xl border border-[#ECECEC] bg-white p-[15px] text-left"
    >
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#2C3930]">
          {title}
        </h2>

        {meta != null && (
          <span className="shrink-0 text-[13px] text-[#60655C]">{meta}</span>
        )}

        {/* 비활성 회색(§1.1). 꺾쇠 기하는 `SettingsRow` 와 같은 24 viewBox 를 쓴다. */}
        <svg
          viewBox="0 0 24 24"
          className="size-[18px] shrink-0 text-[#B4B4B4]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </div>

      <div className="mt-3">{children}</div>
    </button>
  );
}
