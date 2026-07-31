export const ROUTES = {
  root: '/',
  auth: '/auth',
  authLogin: '/auth/login',
  authSignup: '/auth/signup',
  authCallback: '/auth/callback',
  home: '/home',
  timeline: '/timeline',
  profile: '/profile',
  profileEdit: '/profile/edit',
  subscription: '/profile/subscription',
  calendar: '/profile/calendar',
  favorites: '/profile/favorites',
  privacy: '/profile/privacy',
  blog: '/blog',
  blogCreate: '/blog/create',
  premium: '/premium',
  journey: '/journey',
  /** 새 동선 만들기(날짜를 골라 동선을 그리고 저장한다). */
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
