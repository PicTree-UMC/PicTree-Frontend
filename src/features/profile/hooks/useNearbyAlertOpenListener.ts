import { useEffect } from 'react';

import { useOpenNearbyAlertLog } from './useNearbyAlerts';

/**
 * 푸시 알림을 눌러서 앱으로 돌아왔을 때 확인 처리를 건다.
 *
 * 확인 처리(`PATCH /nearby-alerts/logs/{id}/open`)는 서비스 워커가 직접 못
 * 부른다 — 거기엔 액세스 토큰이 없다. 그래서 워커가 `postMessage` 로 알려주고
 * 앱이 대신 부른다.
 *
 * 앱이 닫혀 있어서 새 창으로 열린 경우에는 메시지를 받을 상대가 없으므로,
 * 워커가 URL 에 `?alertLogId=` 를 붙여 준다. 그 경우도 여기서 처리하고 주소창을
 * 정리한다 — 새로고침할 때마다 같은 요청이 또 나가면 안 된다.
 */
export const useNearbyAlertOpenListener = () => {
  const { mutate: markOpened } = useOpenNearbyAlertLog();

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('alertLogId');

    if (fromUrl) {
      markOpened(Number(fromUrl));

      const url = new URL(window.location.href);
      url.searchParams.delete('alertLogId');
      window.history.replaceState({}, '', url);
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'nearby-alert-opened' && event.data.alertLogId) {
        markOpened(Number(event.data.alertLogId));
      }
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [markOpened]);
};
