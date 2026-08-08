export type MyProfile = {
  id: number;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  status: string;
  currentPlan: string;
  /**
   * 근처 나무 알림 수신 동의. **지금은 아무도 읽지 않는다** — 웹 푸시를 걷어내면서
   * 이 플래그를 보던 곳(알림 토글·발송 판정)이 전부 사라졌다. 서버가 계속 주는
   * 값이라 응답 모양으로만 남겨 둔다.
   */
  notification: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * `PATCH /users/me` 요청 본문. 두 필드 모두 선택이며 보낸 것만 반영된다.
 * 하나도 안 보내면 400 `USER_INVALID_UPDATE_REQUEST`.
 *
 * 서버는 `notification` 도 받지만 여기서 뺐다 — 켜고 끌 화면이 없어진 필드를
 * 남겨 두면 어딘가에 토글이 있는 줄 알게 된다.
 */
export type UpdateMyProfileRequest = {
  nickname?: string;
  /** null 이면 프로필 이미지 제거 */
  profileImageUrl?: string | null;
};

/** `PATCH /users/me` 응답의 `data`. 조회와 달리 `createdAt` 이 없다. */
export type UpdatedMyProfile = Omit<MyProfile, 'createdAt'>;
