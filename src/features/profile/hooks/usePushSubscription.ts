import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useToast } from '@/shared/components';
import {
  deactivatePushSubscription,
  getMyPushSubscriptions,
  registerPushSubscription,
} from '../api/pushApi';
import { isClientError } from '../lib/profileError';
import {
  activeSubscriptionIds,
  hasActivePushSubscription,
} from '../lib/pushSubscription';

export const pushKeys = {
  all: ['push-subscriptions'] as const,
  mine: () => [...pushKeys.all, 'me'] as const,
};

/**
 * 내 푸시 구독 목록 조회 훅. `GET /push-subscriptions/me`
 *
 * 마이페이지 알림 토글이 이 값을 보고 켜짐/꺼짐을 정한다. `isActive` 가 하나라도
 * true 면 켜진 것이다 — 구독은 기기마다 생기므로 전부 켜져 있을 필요는 없다.
 *
 * 구독이 없으면 빈 배열이고, 그건 에러가 아니라 "알림을 안 켠 상태" 다.
 */
export const useMyPushSubscriptions = () => {
  const accessToken = useAuthStore((state) => state.accessToken);

  const query = useQuery({
    queryKey: pushKeys.mine(),
    queryFn: getMyPushSubscriptions,
    enabled: Boolean(accessToken),
    /** 4xx 는 반복해도 결과가 같다. 5xx·네트워크 오류만 1회 재시도한다. */
    retry: (failureCount, error) => (isClientError(error) ? false : failureCount < 1),
  });

  return { ...query, isEnabled: hasActivePushSubscription(query.data) };
};

/**
 * 푸시 구독 등록 훅. `POST /push-subscriptions`
 *
 * 근처 나무 알림을 켤 때 부른다. 브라우저 `pushManager.subscribe()` 결과를
 * 그대로 넘기면 된다.
 *
 * 서버가 `upsert` 라 같은 기기에서 여러 번 불러도 구독이 늘지 않는다.
 *
 * 성공하면 구독 목록을 무효화한다 — 마이페이지 토글이 그 목록을 보고 켜짐/꺼짐을
 * 판단하므로, 갱신하지 않으면 방금 켠 것이 반영되지 않는다.
 */
export const useRegisterPushSubscription = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: registerPushSubscription,

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pushKeys.mine() });
    },

    onError: () => {
      showToast('알림 설정에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error');
    },
  });
};

/**
 * 푸시 구독 비활성화 훅. `PATCH /push-subscriptions/{id}/deactivate`
 *
 * 알림을 끌 때 부른다. id 를 주면 그 구독만, 안 주면 **활성 구독 전부**를 끈다.
 * 마이페이지 토글은 "이 계정의 알림" 을 끄는 것이므로 전부가 기본이다.
 *
 * 여러 건을 `allSettled` 로 돌린다 — 한 기기 구독이 이미 서버에서 정리됐어도
 * (404) 나머지는 꺼져야 한다. 하나라도 성공하면 토글은 꺼진 상태가 된다.
 * 전부 실패했을 때만 에러로 올린다.
 */
export const useDeactivatePushSubscription = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (subscriptionId?: number) => {
      const targets =
        subscriptionId != null
          ? [subscriptionId]
          : activeSubscriptionIds(
              queryClient.getQueryData(pushKeys.mine()),
            );

      if (targets.length === 0) {
        return;
      }

      const results = await Promise.allSettled(
        targets.map((id) => deactivatePushSubscription(id)),
      );

      if (results.every((result) => result.status === 'rejected')) {
        throw new Error('푸시 구독 비활성화에 모두 실패했습니다.');
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pushKeys.mine() });
    },

    onError: () => {
      showToast('알림 해제에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error');
    },
  });
};
