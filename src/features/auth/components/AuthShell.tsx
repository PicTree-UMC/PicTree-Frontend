import type { PropsWithChildren } from 'react';

/**
 * 로그인·약관 화면의 공통 셸. 자식(WelcomeView/TermsAgreementView)이 `flex-1`·`mt-auto` 로
 * 세로를 채우므로 여기서 flex 컬럼과 높이·여백을 확정한다.
 *
 * ⚠️ 되돌리지 말 것 — 아래 3가지는 전부 실기기에서만 드러나던 문제의 원인이었다.
 *  1) min-h-full: 예전엔 main·section 이 각각 `min-h-screen`(100vh) 이었다. AppShell 이 이미
 *     `h-dvh` 로 컬럼 높이를 확정하는데, 주소창이 떠 있으면 100vh > dvh 라 셸이 컬럼을 넘겨
 *     하단 로그인 버튼이 첫 화면 밖으로 밀렸다. 뷰포트 단위를 아는 곳은 AppShell 하나다.
 *  2) 래퍼 하나로 축소: section 의 `overflow-y-auto` 는 AppShell 컬럼과 겹치는 중첩 스크롤이었고,
 *     min-h-full 을 두 겹으로 쌓으면 안쪽 %가 auto 높이에 걸려 풀리지 않는다.
 *  3) safe-area: index.html 에 `viewport-fit=cover` 가 있어 뷰포트가 상태바·홈 인디케이터까지
 *     확장된다. 상수 `pt-3`/`pb-10` 만 있던 탓에 약관 화면 제목이 노치에 묻히고, 로그인 버튼
 *     아래가 홈 인디케이터와 6px 까지 붙었다. 시안 여백(12px/40px)은 인디케이터 "바깥"
 *     기준이므로 inset 을 더하거나(위) 최소값으로 깔아야(아래) 시안대로 보인다.
 */
export function AuthShell({ children }: PropsWithChildren) {
  return (
    <main className="relative flex min-h-full w-full flex-col bg-[#FFFCEF] px-6 pb-[max(calc(env(safe-area-inset-bottom)+1.25rem),2.5rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] text-[#2c3930]">
      {children}
    </main>
  );
}
