import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/shared/components';
import { registerPushSubscription } from '../api/pushApi';

export const pushKeys = {
  all: ['push-subscriptions'] as const,
  mine: () => [...pushKeys.all, 'me'] as const,
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
