/* eslint-env serviceworker */

/**
 * 근처 나무 알림용 서비스 워커.
 *
 * 푸시를 받으려면 서비스 워커가 반드시 있어야 한다 — 브라우저는 앱이 닫혀 있을
 * 때도 알림을 띄워야 하므로 페이지 스크립트가 아니라 여기로 이벤트를 준다.
 *
 * 캐싱은 하지 않는다. 오프라인 지원은 이번 작업 범위가 아니고, 어설픈 캐시는
 * 배포 후에도 옛 화면이 남는 문제를 만든다.
 */

// 새 버전을 받으면 기다리지 않고 바로 교체한다. 알림 문구를 고쳤는데 예전
// 워커가 살아 있어 반영되지 않는 일을 막는다.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

/**
 * 서버(web-push)가 보낸 푸시.
 *
 * 본문이 JSON 이 아닐 수도 있어(브라우저 개발자도구의 "Push" 테스트 버튼은 그냥
 * 문자열을 보낸다) 파싱 실패를 정상 경로로 다룬다.
 */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || '근처에 심어둔 나무가 있어요';
  const options = {
    body: payload.body || '지난 기록을 열어볼까요?',
    icon: '/apple-touch-icon.jpg',
    badge: '/apple-touch-icon.jpg',
    // 같은 나무 알림이 여러 개 쌓이지 않게 묶는다
    tag: payload.alertLogId ? `nearby-${payload.alertLogId}` : 'nearby',
    data: {
      alertLogId: payload.alertLogId ?? null,
      treeId: payload.treeId ?? null,
      url: payload.url || '/home',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * 알림 클릭.
 *
 * 이미 열려 있는 탭이 있으면 그리로 포커스한다 — 누를 때마다 새 탭이 쌓이면
 * 로그인 상태가 갈라져 보인다.
 *
 * 확인 처리(`PATCH /nearby-alerts/logs/{id}/open`)는 여기서 직접 부르지 않는다.
 * 서비스 워커에는 액세스 토큰이 없어서다. 대신 열린 페이지에 메시지를 보내
 * 앱 쪽에서 부르게 한다.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { alertLogId, url } = event.notification.data || {};
  const target = url || '/home';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({ type: 'nearby-alert-opened', alertLogId });
            return client.focus();
          }
        }

        return self.clients.openWindow(
          alertLogId ? `${target}?alertLogId=${alertLogId}` : target,
        );
      }),
  );
});
