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
 */
export function BlogEmptyState() {
  return (
    <div className="flex flex-col items-center px-8 pt-[24vh] text-center">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#bcd08c"
        strokeWidth="1.5"
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

      <h2
        className="animate-fade-in-up mt-5 text-[17px] font-medium text-ink"
        style={{ animationDelay: "700ms" }}
      >
        아직 작성한 블로그가 없어요
      </h2>
      <p
        className="animate-fade-in-up mt-2 text-[15px] leading-6 text-ink-muted"
        style={{ animationDelay: "700ms" }}
      >
        여행 기록으로 블로그 초안을 만들어보세요.
        <br />
        우측 하단 버튼으로 시작할 수 있어요.
      </p>
    </div>
  );
}
