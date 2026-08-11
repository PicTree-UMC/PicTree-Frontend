import { EmptyState } from '@/shared/components';

/**
 * 저장한 블로그가 하나도 없을 때.
 *
 * 그림이 살아난다 — 책등이 서고, 양쪽 페이지가 가운데서 펼쳐지고, 글줄이
 * 위에서부터 차례로 찍힌다. 타임라인(새싹)·동선(경로) 빈 화면과 같은 결로,
 * 문구는 그림이 끝날 즈음(700ms) `fade-in-up` 으로 떠오른다.
 *
 * 아이콘은 기존 `EmptyBlogIcon` 과 같은 책인데, 페이지를 따로 움직여야 해서
 * 책등·페이지·글줄을 조각으로 나눠 여기서 직접 그린다.
 *
 * CTA 버튼은 없다 — 작성 진입은 우하단 연필 FAB 이고, 문구가 그걸 가리킨다.
 *
 * 얼개·간격은 공용 `EmptyState` 가 갖는다(이슈 #274). 한때 여기만 `pt-[24vh]` 로
 * **화면 높이의 24% 지점에 고정**돼 있어서, 기기가 커질수록 다른 탭과 다른 높이에서
 * 글이 시작했다.
 */
export function BlogEmptyState() {
  return (
    <EmptyState
      illustration={
        /*
          120px. 한때 64px 였는데 옆 탭 그림이 150~157px 이라 여기만 눈에 띄게 작았다.
          선 굵기는 뷰박스가 24라 화면 크기에 비례해 두꺼워진다 — 64px 에서 4px 로 보이던
          굵기를 지키려고 1.5 → 0.8 로 같이 줄인다(0.8 × 120/24 = 4px).
        */
        <svg
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#bcd08c"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {/* 책등 — 먼저 서고, 여기서 페이지가 펼쳐진다 */}
          <path className="animate-blog-spine" d="M12 4.5v15.5" />
          <path
            className="animate-blog-page-left"
            d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5Z"
          />
          <path
            className="animate-blog-page-right"
            d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5Z"
          />
          {/* 글줄 — 왼쪽 페이지 위→아래, 오른쪽도 반 박자 뒤에 위→아래 */}
          <path className="animate-blog-tick" style={{ animationDelay: "560ms" }} d="M7 8.5h1.5" />
          <path className="animate-blog-tick" style={{ animationDelay: "660ms" }} d="M7 11.5h1.5" />
          <path className="animate-blog-tick" style={{ animationDelay: "760ms" }} d="M7 14.5h1.5" />
          <path className="animate-blog-tick" style={{ animationDelay: "640ms" }} d="M15.5 8.5h1.5" />
          <path className="animate-blog-tick" style={{ animationDelay: "740ms" }} d="M15.5 11.5h1.5" />
          <path className="animate-blog-tick" style={{ animationDelay: "840ms" }} d="M15.5 14.5h1.5" />
        </svg>
      }
      title="아직 작성한 블로그가 없어요"
      description={
        <>
          여행 기록으로 블로그 초안을 만들어보세요.
          <br />
          우측 하단 버튼으로 시작할 수 있어요.
        </>
      }
      /* 책이 펼쳐지고 글줄이 다 찍힐 즈음. */
      revealDelay={700}
    />
  );
}
