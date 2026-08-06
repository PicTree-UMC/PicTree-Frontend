/**
 * 알림 기록 '삭제' 를 이 브라우저에서만 흉내 내기 위한 저장소.
 *
 * ⚠️ **진짜 삭제가 아니다.** 서버 `nearby-alerts` 에는 삭제 엔드포인트가 없다
 * (`POST check` · `GET logs` · `PATCH logs/:id/open` 이 전부다). 그래서 지운 id 를
 * 여기 적어 두고 목록에서 걸러낼 뿐이다. 다음 두 가지가 따라온다.
 *
 *  - 다른 기기·다른 브라우저에서는 그대로 보인다.
 *  - 브라우저 데이터를 비우면 되살아난다.
 *
 * 사용자가 "지웠는데 왜 남아 있지" 하지 않도록 화면에 이 한계를 적어 두었다
 * (`AlertLogsPage`). 서버에 삭제 API 가 생기면 이 파일과 화면의 안내를 함께
 * 걷어내고 실제 호출로 바꾼다.
 */

const STORAGE_KEY = 'pictree.hiddenAlertLogs';

/**
 * 저장된 id 집합. 읽기 실패는 조용히 빈 집합으로 떨어뜨린다 — 사파리 사생활
 * 보호 모드처럼 localStorage 접근 자체가 막히는 환경이 있고, 그때 화면이 죽는
 * 것보다 '숨김이 안 먹는' 편이 낫다.
 */
export function readHiddenAlertLogs(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((id): id is number => typeof id === 'number'));
  } catch {
    return new Set();
  }
}

/** 쓰기도 실패를 삼킨다 — 저장이 안 되면 다음 진입에 다시 보일 뿐이다. */
function write(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* 저장 불가 환경 — 무시한다 */
  }
}

/** 지정한 id 들을 숨김 목록에 더한다. 갱신된 전체 집합을 돌려준다. */
export function hideAlertLogs(alertLogIds: number[]): Set<number> {
  const next = readHiddenAlertLogs();
  for (const id of alertLogIds) next.add(id);
  write(next);
  return next;
}

/** 숨김을 전부 되돌린다. */
export function clearHiddenAlertLogs(): Set<number> {
  const empty = new Set<number>();
  write(empty);
  return empty;
}
