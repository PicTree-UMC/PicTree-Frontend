export type MyProfile = {
  id: number;
  email: string | null;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  status: string;
  currentPlan: string;
  notification: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * `PATCH /users/me` 요청 본문. 세 필드 모두 선택이며 보낸 것만 반영된다.
 * 하나도 안 보내면 400 `USER_INVALID_UPDATE_REQUEST`.
 */
export type UpdateMyProfileRequest = {
  nickname?: string;
  /** null 이면 프로필 이미지 제거 */
  profileImageUrl?: string | null;
  notification?: boolean;
};

/** `PATCH /users/me` 응답의 `data`. 조회와 달리 `createdAt` 이 없다. */
export type UpdatedMyProfile = Omit<MyProfile, 'createdAt'>;
