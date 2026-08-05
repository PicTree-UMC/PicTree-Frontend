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

  /*
   * ⚠️ 서버는 **나무 한 그루당 푸시 하나**를 보낸다(`check` 의 `for (const tree of trees)`).
   * 반경 안에 3그루면 푸시가 3번 온다. 그대로 두면 알림이 3개 쌓이는데,
   * 화면(지도 카드)은 클러스터 마커처럼 하나로 묶어 보여주므로 서로 어긋난다.
   *
   * 그래서 여기서 합친다. 브라우저는 **같은 `tag`** 를 가진 알림이 오면 새로 쌓지
   * 않고 기존 것을 교체하므로, 태그를 고정하고 이미 떠 있는 알림을 세어 개수로
   * 바꿔 준다 — 지도 카드와 같은 문구가 된다.
   */
  event.waitUntil(showMergedNotification(payload));
});

/** 근처 나무 알림은 이 태그 하나로 묶는다. 같은 태그면 브라우저가 교체한다. */
const NEARBY_TAG = 'nearby';

async function showMergedNotification(payload) {
  const existing = await self.registration.getNotifications({ tag: NEARBY_TAG });

  // 이미 떠 있는 알림이 묶고 있던 개수. 없으면 이번이 첫 알림이다.
  const merged = (existing[0]?.data?.mergedCount ?? 0) + 1;

  // 묶인 나무 id 들 — 알림을 눌렀을 때 함께 열기 위해 모아 둔다.
  const treeIds = [...(existing[0]?.data?.treeIds ?? [])];
  if (payload.treeId != null && !treeIds.includes(payload.treeId)) {
    treeIds.push(payload.treeId);
  }

  const body =
    merged > 1
      ? `저장된 기록 ${merged}개 · 지난 기록을 열어볼까요?`
      : payload.body || '지난 기록을 열어볼까요?';

  return self.registration.showNotification(
    payload.title || '근처에 심어둔 나무가 있어요',
    {
      body,
      icon: '/apple-touch-icon.jpg',
      badge: '/apple-touch-icon.jpg',
      tag: NEARBY_TAG,
      // 교체될 때 다시 울리지 않게 한다 — 3그루면 진동이 3번 오면 안 된다.
      renotify: false,
      data: {
        mergedCount: merged,
        treeIds,
        // 확인 처리는 가장 최근 것 하나만 건다(여러 건이면 목록에서 확인한다).
        alertLogId: payload.alertLogId ?? existing[0]?.data?.alertLogId ?? null,
        treeId: payload.treeId ?? null,
        url: payload.url || '/home',
      },
    },
  );
}

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

  const { alertLogId, treeIds, url } = event.notification.data || {};
  const target = url || '/home';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            // 여러 그루가 묶인 알림이면 id 를 함께 넘겨 지도가 다 열게 한다.
            client.postMessage({ type: 'nearby-alert-opened', alertLogId, treeIds });
            return client.focus();
          }
        }

        return self.clients.openWindow(
          alertLogId ? `${target}?alertLogId=${alertLogId}` : target,
        );
      }),
  );
});
