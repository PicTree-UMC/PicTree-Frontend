export const ROUTES = {
  root: '/',
  auth: '/auth',
  authLogin: '/auth/login',
  authSignup: '/auth/signup',
  authCallback: '/auth/callback',
  home: '/home',
  timeline: '/timeline',
  /**
   * 마이페이지 — **탭 세 개짜리 한 화면**이다(메인 · 프로필 · 질문).
   *
   * 아래 `profileMe`·`helpFaq` 는 전부 같은 `ProfilePage` 를 그리고, 어느 탭이 열리는지만
   * 경로가 정한다. 탭을 화면 state 로만 두지 않은 이유는 셋이다 — 딥링크가 되고,
   * 뒤로가기가 탭을 되짚고, 새로고침해도 보던 탭이 남는다.
   *
   * ⚠️ **요금제는 탭이 아니다.** `/premium` 이 앱에서 유일하게 크림이 아닌 바닥을 쓰기
   * 때문이다(`premium/lib/backdrop.ts`) — 탭 하나만 배경이 다르면 탭 줄이 화면을 가르는
   * 게 아니라 두 앱을 오가는 것처럼 읽힌다. 대신 메인 탭의 **요금제 타일**이 그리로 간다.
   *
   * ⚠️ 하단 탭바(`BottomTabBar`)의 '마이' 는 `end` 없이 `/profile` 을 가리킨다 —
   * 그래서 이 하위 경로들에서도 '마이' 가 켜진 채로 있다. 새 탭을 더할 때 이 규칙이
   * 깨지지 않게 반드시 `/profile/` 아래에 둘 것.
   */
  profile: '/profile',
  /** 마이페이지 ② 프로필 탭 — 닉네임·이메일·결제수단·로그아웃/탈퇴. */
  profileMe: '/profile/me',
  /**
   * 옛 '내 정보' 페이지. 지금은 `profileMe` 탭으로 **리다이렉트만** 한다 —
   * 앱 안에서 여기로 보내는 곳은 없지만 북마크·이전 세션 히스토리에 남아 있다.
   */
  profileEdit: '/profile/edit',
  /*
    `subscription: '/profile/subscription'` 은 지웠다. 프로필의 '구독' 줄이 플랜과 무관하게
    /premium 으로 가게 되면서 앱에서 갈 길이 끊겼고, 그 화면에만 있던 저장 용량 사용량은
    마이페이지 요약(`ProfileSummary`)으로 내려왔다. 나머지(혜택 목록·결제 정보·해지)는
    /premium 과 /profile/payment-methods 가 이미 갖고 있다.
  */
  /**
   * 자동결제 카드(빌링키) 관리. 구독 관리와 **따로** 둔다 — 카드는 구독보다 오래 살고
   * (해지해도 남는다) 만료·교체는 구독과 무관하게 일어난다. 한 화면에 섞으면 카드를
   * 지우러 들어간 사람이 구독 해지 버튼 옆에 서게 된다.
   */
  paymentMethods: '/profile/payment-methods',
  calendar: '/profile/calendar',
  favorites: '/profile/favorites',
  privacy: '/profile/privacy',
  /*
    `alertLogs: '/profile/alerts'` 는 지웠다. 근처 나무 알림으로 받은 기록 목록이었는데,
    거기서 할 수 있는 일이 지도로 가는 것뿐이라 홈 배너와 하는 말이 같았다. 알림을
    보내던 웹 푸시 자체도 함께 걷어냈다.
  */
  /**
   * 마이페이지 ③ 질문 탭 — FAQ 아코디언 + 맨 아래 개인정보 처리방침 줄.
   *
   * 경로 이름은 그대로 뒀다. 옛 '도움말 / FAQ' 페이지가 있던 자리이고, 탭이 하는 일도
   * 같아서 리다이렉트를 만들 이유가 없다.
   */
  helpFaq: '/profile/help',
  blog: '/blog',
  blogCreate: '/blog/create',
  blogDetail: '/blog/:draftId',
  premium: '/premium',
  // 토스 빌링 인증 후 리다이렉트되는 착지 라우트 (successUrl/failUrl 오리진 뒤 경로)
  premiumBillingSuccess: '/premium/billing/success',
  premiumBillingFail: '/premium/billing/fail',
  /**
   * ⚠️ **동선 도메인에서 `journey` 라는 이름이 남은 유일한 곳이다.** 코드 용어는 서버에 맞춰
   * `route` 로 통일했지만(#185) URL 은 사용자에게 보이고 북마크·공유 링크에 박혀 있어서
   * 같이 바꾸지 않았다. 아래 `journeyView*` · `journeyViewPath` · `nav-journey*.svg` 가
   * 여기 묶여 있다. 바꾸려면 옛 경로 리다이렉트를 함께 넣어야 한다.
   *
   * 이 파일의 `ROUTES` 는 **URL 경로 상수**지 동선(route) 도메인이 아니다 — 이름이 겹쳐
   * 보이지만 다른 것이다.
   */
  journey: '/journey',
  /** 새 동선 만들기 ①단계 — 날짜 고르기. 여기서 고른 날짜를 `?dates=` 로 ② 에 넘긴다. */
  journeyCreate: '/journey/create',
  /** 새 동선 만들기 ②단계 — 지도에서 장소를 다듬고 저장한다(`?dates=` 필수). */
  journeyView: '/journey/view',
  /** 저장된 동선 보기. **패턴**이라 이동할 땐 아래 `journeyViewPath` 를 쓴다. */
  journeyViewDetail: '/journey/view/:routeId',
  camera: '/camera',
} as const;

/**
 * `/journey/view/:routeId` 의 실제 경로.
 *
 * 두 화면을 한 페이지가 겸하고 **id 유무가 모드를 가른다** — 쿼리(`?routeId=`)로 하면
 * URL 만 보고 어느 화면인지 알 수 없어서 하위 경로로 갈랐다.
 */
export const journeyViewPath = (routeId: number) => `/journey/view/${routeId}`;

/** 저장된 AI 블로그 초안의 상세 경로. */
export const blogDetailPath = (draftId: number | string) => `/blog/${draftId}`;
