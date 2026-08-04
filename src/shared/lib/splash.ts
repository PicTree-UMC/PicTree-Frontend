/**
 * index.html 에 박아둔 스플래시(#splash)를 걷어낸다.
 *
 * 최소 노출시간을 두는 이유: 캐시가 더운 상태에선 마운트가 200ms 안에 끝나 로고가
 * 깜빡이고 마는데, 그게 없는 것보다 산만하다. 기준점은 `performance.now()`(문서 시작
 * 시점부터의 경과 ms) — 스플래시는 첫 페인트부터 떠 있으므로 별도 타임스탬프를 심을
 * 필요가 없다.
 */

/*
 * index.html 의 글자 등장 애니메이션이 다 끝나는 시점(520ms + 마지막 글자 지연 540ms
 * ≈ 1.06초)보다 넉넉히 뒤여야 한다. 1.2초로 두면 마지막 E 가 도착하자마자 화면이
 * 걷혀 배치를 볼 틈이 없다.
 */
const MIN_VISIBLE_MS = 1800;

/** index.html 의 `#splash` transition 시간과 반드시 일치해야 한다. */
const FADE_MS = 320;

export function hideSplash() {
  const splash = document.getElementById('splash');

  if (!splash) {
    return;
  }

  // 외부 리다이렉트 착지 경로에선 index.html 이 이미 숨겨 뒀다. 기다릴 이유가 없으니 바로 뗀다.
  if (document.documentElement.classList.contains('no-splash')) {
    splash.remove();
    return;
  }

  const remaining = Math.max(0, MIN_VISIBLE_MS - performance.now());

  window.setTimeout(() => {
    splash.classList.add('is-hiding');

    // transitionend 대신 타이머로 지우는 이유: prefers-reduced-motion 이면 transition 이
    // 없어 이벤트가 아예 안 오고, 스플래시가 화면에 영영 남는다.
    window.setTimeout(() => splash.remove(), FADE_MS);
  }, remaining);
}
