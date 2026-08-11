import { useTravelCalendar } from '@/features/profile/hooks/useTravelCalendar';
import { getLocalDateString } from '@/shared/lib/date';
import { DAILY_TREE_LIMIT } from '../lib/treeQuota';

export interface TodayTreeQuota {
  /** 오늘 심은 나무 수. 아직 못 받았으면 0 이다. */
  used: number;
  /** 오늘 더 심을 수 있는 수. */
  remaining: number;
  /** 하루 한도(`DAILY_TREE_LIMIT`). 문구에 숫자를 박지 않으려고 같이 준다. */
  limit: number;
  /** 한도를 다 채웠는지. **모르는 동안은 `false`** — 아래 주석 참고. */
  isFull: boolean;
}

/**
 * 오늘 남은 나무 저장 한도.
 *
 * **`GET /calendar` 를 그대로 쓴다.** 이번 달 응답의 `days[].count` 에 오늘치가 들어 있고,
 * queryKey(`['calendar', 연, 월]`)가 여행 캘린더 화면과 같아서 둘이 캐시를 나눠 쓴다.
 * 나무를 심거나 지우는 곳이 모두 `calendarKeys.all` 을 무효화하고 있어(`useCreateTreeRecord`,
 * `useTrees`, `useDeleteRecord`) 별도 갱신 장치도 필요 없다 — **지우면 한도가 다시 열리는 것**
 * 까지 서버 규칙과 그대로 맞는다.
 *
 * 홈이 이미 들고 있는 나무 전체 목록에서 오늘 날짜를 세는 방법도 있고 요청이 0회지만,
 * 서버는 KST 자정 기준이고 기기는 로컬 시간이라 집계가 갈릴 수 있어 쓰지 않는다.
 *
 * ⚠️ **모르면 열어 둔다.** 로그인 전·로딩 중·조회 실패면 `used` 가 0 이라 `isFull` 은
 * `false` 다. 막지 못해 헛걸음하는 편이, 심을 수 있는데 막아 세우는 것보다 낫다 —
 * 그 경우는 저장할 때 서버 429 가 잡는다(`isDailyTreeLimitError`).
 */
export function useTodayTreeQuota(): TodayTreeQuota {
  const today = new Date();
  const { countByDate } = useTravelCalendar(today.getFullYear(), today.getMonth() + 1);

  const used = countByDate[getLocalDateString(today)] ?? 0;
  const remaining = Math.max(0, DAILY_TREE_LIMIT - used);

  return { used, remaining, limit: DAILY_TREE_LIMIT, isFull: remaining === 0 };
}
