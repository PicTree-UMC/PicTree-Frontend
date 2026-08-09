import { useEffect, type RefObject } from 'react';

import { WELCOME_TOAST_CSS_VAR } from '../lib/authToast';

/**
 * 로그인 화면에서 **문구와 로그인 버튼 사이 빈칸의 정중앙**을 재서 CSS 변수로 내건다.
 * 토스트(`Toaster`)가 그 값을 자리로 쓴다.
 *
 * ⚠️ **왜 상수가 아니라 실측인가.** 처음엔 `WelcomeView` 의 여백을 더해 상수로 뒀다가
 * 57px 어긋났다. 그 빈칸은 `pb-[9.25rem]` 크기가 아니다 — 위 블록이 `flex-1` +
 * `justify-center` 라 남는 높이의 절반이 문구 아래로 더 붙는다. 즉 **빈칸 높이가 기기
 * 화면 높이에 따라 변한다**(390×812 에서 148px 이 아니라 263px 이었다). 상수로 맞추려면
 * `100dvh` 에 헤더·버튼·일러스트 높이를 전부 빼는 식이 되는데, 그러면 저 값 중 하나만
 * 바뀌어도 조용히 어긋난다.
 *
 * **아래에서부터 재는 이유**는 따로 있다. 토스트는 `position: fixed` 라 스크롤과 무관한데,
 * 아래를 기준으로 두면 주소창이 접혔다 펴져 뷰포트가 변해도 버튼 묶음과의 거리가 그대로다.
 *
 * 변수는 이 화면이 떠 있는 동안에만 존재한다 — 화면을 벗어나면 지운다. 남겨 두면 다른
 * 화면 토스트가 여기 좌표를 물려받는다.
 */
export function useWelcomeToastAnchor(
  /** 문구 블록(마크 + 제목 + 한 줄 설명)의 아래 모서리를 잴 대상. */
  contentRef: RefObject<HTMLElement | null>,
  /** 로그인 버튼 묶음의 위 모서리를 잴 대상. */
  actionsRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root = document.documentElement;

    const measure = () => {
      const content = contentRef.current;
      const actions = actionsRef.current;

      if (!content || !actions) return;

      const gapTop = content.getBoundingClientRect().bottom;
      const gapBottom = actions.getBoundingClientRect().top;
      // 화면 아래 모서리에서 빈칸 정중앙까지.
      const fromBottom = window.innerHeight - (gapTop + gapBottom) / 2;

      root.style.setProperty(WELCOME_TOAST_CSS_VAR, `${Math.round(fromBottom)}px`);
    };

    measure();

    /*
      ⚠️ **두 블록만 보면 안 된다.** `ResizeObserver` 는 크기 변화만 알리는데, 화면 높이가
      달라질 때 이 둘은 크기가 그대로고 **위치만** 움직인다 — 실제로 640px 로 줄였더니
      관찰자가 잠자코 있어 토스트가 43px 어긋난 채 남았다.

      그래서 높이가 같이 변하는 셸(`AuthShell` 의 `<main>`)을 함께 본다. 빈칸을 밀어내는
      건 결국 그 높이라, 여기가 바뀌면 자리도 반드시 다시 재야 한다. 창 `resize` 는
      주소창이 접히는 경우를 위해 남겨 둔다(셸이 `min-h-full` 이라 한 박자 늦을 수 있다).
    */
    const observer = new ResizeObserver(measure);
    if (contentRef.current) observer.observe(contentRef.current);
    if (actionsRef.current) observer.observe(actionsRef.current);

    const shell = contentRef.current?.closest('main');
    if (shell) observer.observe(shell);

    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      root.style.removeProperty(WELCOME_TOAST_CSS_VAR);
    };
  }, [contentRef, actionsRef]);
}
