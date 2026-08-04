/**
 * PWA 푸시 구독. 서버 `PushSubscriptionResponseDto` 기준이다.
 *
 * ⚠️ 명세서는 id 를 `pushSubscriptionId` 라고 적었지만 서버는 `subscriptionId`
 * 로 준다. 비활성화(`PATCH /push-subscriptions/{subscriptionId}/deactivate`)
 * 경로에도 이 값이 들어간다.
 */
export interface PushSubscription {
  subscriptionId: number;
  /** 브라우저 푸시 서비스 주소. 기기·브라우저마다 다르다. */
  endpoint: string;
  userAgent: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * `POST /push-subscriptions` 요청 본문.
 *
 * ⚠️ 명세서의 RequestBody 는 비어 있지만 서버
 * `CreatePushSubscriptionRequestDto` 는 이 세 가지를 요구한다. `endpoint` 와
 * `keys` 는 필수다.
 *
 * 값은 전부 브라우저가 만들어 준다 — `pushManager.subscribe()` 가 돌려주는
 * `PushSubscription` 을 `toJSON()` 한 것과 같은 모양이다.
 */
export interface RegisterPushSubscriptionRequest {
  /** `https` 여야 하고 서버 허용 목록에 있어야 한다. 아니면 400 이다. */
  endpoint: string;
  keys: {
    /** P-256 ECDH 공개키 */
    p256dh: string;
    /** Push 인증 시크릿 */
    auth: string;
  };
  /** 어느 기기에서 구독했는지 구분용. 선택이다. */
  userAgent?: string;
}
