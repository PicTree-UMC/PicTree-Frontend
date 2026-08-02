import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useToast } from '@/shared/components';
import { deactivatePushSubscription, registerPushSubscription } from '../api/pushApi';
import { updateMyProfile } from '../api/userApi';
import { activeSubscriptionIds } from '../lib/pushSubscription';
import {
  getPushUnavailableReason,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/webPush';
import { pushKeys } from './usePushSubscription';
import { userKeys } from './useMyProfile';

/** 푸시를 못 쓰는 이유별 안내 문구. */
const UNAVAILABLE_MESSAGE = {
  unsupported: '이 브라우저는 알림을 지원하지 않아요.',
  'ios-needs-install':
    '아이폰은 홈 화면에 추가한 뒤에야 알림을 받을 수 있어요. 공유 → 홈 화면에 추가를 눌러주세요.',
  'missing-vapid-key': '알림 설정이 아직 준비되지 않았어요.',
} as const;

/**
 * 근처 나무 알림 켜기/끄기.
 *
 * **두 가지를 함께 다룬다.** 서버 `check` 가 둘 다 있어야 알림을 쏘기 때문이다:
 * 1. `GET /users/me` 의 `notification` 플래그 — 사용자의 의사
 * 2. 활성 푸시 구독 — 실제로 보낼 수 있는 통로
 *
 * 하나만 바꾸면 "켰는데 안 온다"(플래그만 켜짐)거나 "껐는데 온다"(구독이 남음)가
 * 된다. 그래서 토글 하나가 양쪽을 모두 움직인다.
 *
 * 켤 때 순서가 중요하다 — **구독을 먼저 만들고 플래그를 켠다.** 반대로 하면
 * 권한을 거부당했을 때 플래그만 켜진 채로 남아 화면은 "켜짐" 인데 알림은
 * 안 오는 상태가 된다.
 *
 * 끌 때는 서버 구독 비활성화와 브라우저 구독 해제를 모두 한다. 브라우저 구독을
 * 남겨두면 다시 켤 때 옛 endpoint 가 되살아나 서버에 죽은 구독이 쌓인다.
 */
export const useNearbyAlertToggle = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const accessToken = useAuthStore((state) => state.accessToken);

  const setNotificationFlag = async (notification: boolean) => {
    const response = await updateMyProfile(accessToken ?? '', { notification });

    // 2xx 로 내려온 실패 응답 (공통 래퍼 규약상 가능)
    if (response.resultType === 'FAIL') {
      throw new Error(response.error.message);
    }
  };

  return useMutation({
    mutationFn: async (next: boolean) => {
      if (!next) {
        // 끄기 — 서버 구독을 모두 비활성화하고 브라우저 구독도 해제한다.
        const ids = activeSubscriptionIds(queryClient.getQueryData(pushKeys.mine()));
        await Promise.allSettled(ids.map((id) => deactivatePushSubscription(id)));
        await unsubscribeFromPush();
        await setNotificationFlag(false);
        return { enabled: false as const };
      }

      const reason = getPushUnavailableReason();
      if (reason) {
        // 알림을 못 받는 환경이면 플래그도 켜지 않는다 — 켜 봐야 안 온다.
        return { enabled: false as const, reason };
      }

      const subscription = await subscribeToPush();
      if (!subscription) {
        // 권한 거부. 예외가 아니라 사용자의 선택이다.
        return { enabled: false as const, reason: 'denied' as const };
      }

      await registerPushSubscription(subscription);
      await setNotificationFlag(true);
      return { enabled: true as const };
    },

    onSuccess: (result) => {
      if ('reason' in result && result.reason) {
        showToast(
          result.reason === 'denied'
            ? '알림이 차단돼 있어요. 브라우저 설정에서 허용해주세요.'
            : UNAVAILABLE_MESSAGE[result.reason],
          'error',
        );
      }
    },

    onError: () => {
      showToast('알림 설정에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pushKeys.mine() });
      queryClient.invalidateQueries({ queryKey: userKeys.me });
    },
  });
};
