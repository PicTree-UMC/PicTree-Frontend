/**
 * iOS 홈화면 PWA 의 뷰포트 어긋남을 감지해 `--vp-shift` 를 켠다.
 *
 * **증상** — `apple-mobile-web-app-status-bar-style: black-translucent` + `viewport-fit=cover`
 * 를 켜면 iOS 는 웹뷰를 화면 맨 위(=상태바 뒤)에서 시작시키면서도, 레이아웃 뷰포트 높이는
 * **상태바를 뺀 값**으로 잡는다. 그래서 100dvh 가 화면보다 상태바 높이만큼 짧고, 앱 전체가
 * 위로 치우쳐 상단은 시계와 겹치고 하단엔 그만큼 빈 띠가 남는다(#139).
 *
 * **실측** (iPhone 15 Pro Max, 홈화면에 추가한 PWA — 리포트 스크린샷 픽셀 계측)
 * ```
 * screen.height        932   ← 실제 화면
 * innerHeight          873   ← 레이아웃 뷰포트(= 100dvh)
 * env(top) / env(bottom) 59 / 34
 * 932 - 873 = 59 = env(safe-area-inset-top)
 * ```
 * 앱 컬럼 바닥이 화면 873 에서 끝나고 873~932 가 크림(html 배경)으로 남은 것,
 * 탭바 높이가 86+34 로 정확히 나온 것까지 위 수치와 맞는다. 즉 iOS 는 **inset 은 화면
 * 기준으로 주면서 뷰포트만 상태바 높이를 빼서** 준다.
 *
 * **보정** — 실제 보정은 `styles.css` 의 body 규칙이 한다(프레임을 `--vp-shift` 만큼 키워
 * 물리 화면과 일치시킨다). 여기서는 *증상이 있는지만* 판정한다. 값 자체는 CSS 에서
 * `env(safe-area-inset-top)` 을 쓴다 — 어긋난 양이 곧 상태바 높이이고, env 는 기기·회전에
 * 따라 알아서 바뀌기 때문이다.
 *
 * ⚠️ **조건을 좁게 잡는 이유** — 보정이 필요 없는 곳에 걸리면 멀쩡한 화면을 밀어버린다.
 * - `navigator.standalone` 은 iOS 전용이다. 안드로이드 PWA·데스크톱·Safari 탭에는 이 버그가
 *   없는데, 특히 안드로이드는 `screen.height` 에 시스템 바가 포함돼 gap 이 0 이 아니다.
 *   높이 차이만 보고 판단하면 안드로이드를 밀게 된다.
 * - gap 을 실측하는 이유는 애플이 이 동작을 고쳤을 때다. 고쳐지면 gap 이 0 이 되어
 *   보정도 저절로 꺼진다. 상수로 박아두면 그날 반대 방향으로 깨진다.
 */
const VP_GAP_CLASS = 'vp-gap';

function hasViewportGap() {
  // navigator.standalone 은 iOS 전용 비표준 속성이라 타입에 없다.
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  if (iosStandalone !== true) return false;

  // 1px 여유: 기기에 따라 소수점이 섞인다.
  return window.screen.height - window.innerHeight > 1;
}

function sync() {
  document.documentElement.classList.toggle(VP_GAP_CLASS, hasViewportGap());
}

/** 앱 시작 시 한 번 호출한다(main.tsx). 화면 크기가 바뀌면 다시 잰다. */
export function watchViewportGap() {
  sync();
  // 회전하면 두 값이 함께 바뀐다. orientationchange 시점엔 innerHeight 가 아직 옛 값이라
  // 뒤따라오는 resize 로 잰다(그래서 둘 다 듣는다).
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', sync);
}
