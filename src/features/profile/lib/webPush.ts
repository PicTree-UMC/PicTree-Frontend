import type { RegisterPushSubscriptionRequest } from '../types/push';

/** 서버 `VAPID_PUBLIC_KEY` 와 같은 값. 공개키라 번들에 들어가도 된다. */
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

/** 왜 푸시를 못 쓰는지. 화면이 사용자에게 뭐라고 말할지 정하는 데 쓴다. */
export type PushUnavailableReason =
  /** 브라우저가 서비스 워커나 Push API 를 아예 지원하지 않는다. */
  | 'unsupported'
  /** iOS 는 홈 화면에 추가해 설치한 상태에서만 푸시가 된다. */
  | 'ios-needs-install'
  /** 빌드에 VAPID 공개키가 없다. 개발 설정 문제다. */
  | 'missing-vapid-key';

/**
 * iOS 인가. 아이패드는 데스크톱 모드에서 Mac 처럼 보고하므로 터치 지원까지 본다.
 */
const isIOS = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

/** 홈 화면에 추가해 실행한 상태인가(standalone). */
const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // iOS Safari 전용 플래그. 표준이 아니라 타입에 없다.
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * 지금 이 브라우저에서 푸시를 쓸 수 있는가. 못 쓰면 이유를 준다.
 *
 * ⚠️ **iOS 는 홈 화면에 추가해야만 푸시가 온다.** Safari 탭에서는 iOS 16.4
 * 이상이어도 `pushManager.subscribe()` 자체가 실패한다. 웹 표준 제약이라
 * 프론트에서 우회할 방법이 없어, 여기서 미리 걸러 안내 문구를 다르게 준다.
 */
export const getPushUnavailableReason = (): PushUnavailableReason | null => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return isIOS() && !isStandalone() ? 'ios-needs-install' : 'unsupported';
  }

  if (isIOS() && !isStandalone()) {
    return 'ios-needs-install';
  }

  if (!VAPID_PUBLIC_KEY) {
    return 'missing-vapid-key';
  }

  return null;
};

export const isPushAvailable = (): boolean => getPushUnavailableReason() === null;

/**
 * VAPID 공개키(base64url 문자열) → `Uint8Array`.
 *
 * `pushManager.subscribe` 의 `applicationServerKey` 가 바이트 배열만 받는다.
 * base64url 은 `+/` 대신 `-_` 를 쓰고 padding 이 없어 표준 base64 로 되돌린 뒤
 * `atob` 에 넘긴다.
 */
const toApplicationServerKey = (base64Url: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);

  return Uint8Array.from(raw, (char) => char.charCodeAt(0));
};

/** 서비스 워커 등록. 이미 등록돼 있으면 그걸 돌려준다. */
export const registerServiceWorker = (): Promise<ServiceWorkerRegistration> =>
  navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready);

/**
 * 브라우저 구독을 만들고 서버가 받는 형태로 바꾼다.
 *
 * 알림 권한을 먼저 요청한다. 사용자가 거부하면 `null` 을 준다 — 예외가 아니라
 * 정상적인 선택이라서다. 한 번 거부하면 브라우저가 다시 묻지 않으므로,
 * 호출부는 "설정에서 허용해 달라" 는 안내를 띄워야 한다.
 *
 * `userVisibleOnly: true` 는 필수다. 크롬은 눈에 보이는 알림을 띄우지 않는
 * 조용한 푸시를 허용하지 않는다.
 */
export const subscribeToPush = async (): Promise<
  RegisterPushSubscriptionRequest | null
> => {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('VITE_VAPID_PUBLIC_KEY 가 설정되지 않았습니다.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return null;
  }

  const registration = await registerServiceWorker();

  // 이미 구독돼 있으면 그대로 쓴다. 다시 subscribe 하면 endpoint 가 바뀌어
  // 서버에 죽은 구독이 하나 더 쌓인다.
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toApplicationServerKey(VAPID_PUBLIC_KEY),
    }));

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('푸시 구독 정보가 올바르지 않습니다.');
  }

  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    userAgent: navigator.userAgent,
  };
};

/**
 * 이 브라우저의 구독을 해제한다.
 *
 * 서버 비활성화(`PATCH .../deactivate`)와는 별개다 — 서버만 끄고 브라우저 구독을
 * 남겨두면, 다시 켤 때 `getSubscription()` 이 옛 구독을 돌려줘 서버에는 죽은
 * endpoint 가 등록된다.
 *
 * 구독이 없으면 조용히 넘어간다. 끄는 동작이 "이미 꺼져 있음" 때문에 실패하면
 * 안 된다.
 */
export const unsubscribeFromPush = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  await subscription?.unsubscribe();
};

/** 지금 이 브라우저의 구독 endpoint. 없으면 null. */
export const getCurrentEndpoint = async (): Promise<string | null> => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();

  return subscription?.endpoint ?? null;
};
