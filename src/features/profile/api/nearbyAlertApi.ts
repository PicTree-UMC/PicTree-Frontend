import { unwrapApiResponse } from '@/shared/lib/apiResponse';
import { httpClient } from '@/shared/lib/httpClient';
import type { ApiResponse } from '@/shared/types/api';
import type {
  NearbyAlertCheckResult,
  NearbyAlertLog,
  NearbyAlertLogPage,
} from '../types/nearbyAlert';

/** 서버 기본값과 같다(`NearbyAlertQueryDto`). 최대 100 까지 받는다. */
export const NEARBY_ALERT_PAGE_SIZE = 20;

/**
 * 근처 나무 알림 체크. `POST /nearby-alerts/check`
 *
 * 현재 위치를 서버에 넘기면 서버가 반경 100m 안의 나무를 찾아 푸시를 쏘고
 * 알림 기록을 남긴다. 반경은 서버 상수(`NEARBY_TREE_RADIUS_M = 100`)라
 * 프론트에서 조절할 수 없다.
 *
 * ⚠️ 명세서 RequestBody 는 비어 있지만 서버 `CheckNearbyAlertRequestDto` 는
 * `latitude`·`longitude` 를 요구한다. 둘 다 필수다.
 *
 * **`sentCount` 가 0 이어도 정상일 수 있다.** 서버는 이런 순서로 걸러낸다:
 * 1. `GET /users/me` 의 `notificationEnabled` 가 꺼져 있으면 → 0
 * 2. 활성 푸시 구독이 하나도 없으면 → 0
 * 3. 그 나무에 **오늘(한국 날짜) 이미 보냈으면** → 건너뜀
 *
 * 그래서 `nearbyCount` 는 2 인데 `sentCount` 가 0 인 상황이 흔하다. 실패로
 * 취급하면 안 된다.
 *
 * ⚠️ 서버가 `trees` 의 `findNearbyTrees` 를 그대로 쓰는데 그 쿼리에 `userId`
 * 조건이 없다. 지금은 **다른 사람 나무에 대한 알림도 발송된다.** 백엔드에
 * 수정 요청해 둔 상태다.
 */
export async function checkNearbyAlerts(
  latitude: number,
  longitude: number,
): Promise<NearbyAlertCheckResult> {
  const { data } = await httpClient.post<ApiResponse<NearbyAlertCheckResult>>(
    '/nearby-alerts/check',
    { latitude, longitude },
  );

  return unwrapApiResponse(data);
}

/**
 * 근처 나무 알림 기록 조회. `GET /nearby-alerts/logs?page=&size=`
 *
 * 지금까지 발송된(또는 발송 실패한) 알림 목록이다. 푸시를 놓쳤을 때 여기서
 * 다시 확인할 수 있다.
 *
 * ⚠️ 명세서 RequestParam 표는 비어 있지만 서버 `NearbyAlertQueryDto` 는
 * `page`(기본 1, 최소 1) 와 `size`(기본 20, 최대 100) 를 받는다.
 *
 * ⚠️ 명세서에는 이 엔드포인트의 기능 설명이 확인 처리(`open`) 쪽 문구로
 * 잘못 적혀 있다. 응답 형태는 목록이 맞다.
 */
export async function getNearbyAlertLogs({
  page = 1,
  size = NEARBY_ALERT_PAGE_SIZE,
}: { page?: number; size?: number } = {}): Promise<NearbyAlertLogPage> {
  const { data } = await httpClient.get<ApiResponse<NearbyAlertLogPage>>(
    '/nearby-alerts/logs',
    { params: { page, size } },
  );

  const body = unwrapApiResponse(data);

  return {
    items: body?.items ?? [],
    page: body?.page ?? page,
    size: body?.size ?? size,
    totalElements: body?.totalElements ?? 0,
    totalPages: body?.totalPages ?? 0,
    hasNext: body?.hasNext ?? false,
  };
}

/**
 * 알림 확인 처리. `PATCH /nearby-alerts/logs/{alertLogId}/open`
 *
 * 푸시를 눌렀거나 기록 목록에서 내용을 봤을 때 부른다. `status` 가 `OPENED` 로
 * 바뀌고 `openedAt` 이 채워진 기록 한 건이 돌아온다.
 *
 * 실패 코드: 404 `NEARBY_ALERT_NOT_FOUND`(없거나 내 것이 아닌 기록).
 */
export async function openNearbyAlertLog(
  alertLogId: number,
): Promise<NearbyAlertLog> {
  const { data } = await httpClient.patch<ApiResponse<NearbyAlertLog>>(
    `/nearby-alerts/logs/${alertLogId}/open`,
  );

  return unwrapApiResponse(data);
}

/**
 * 알림 기록 삭제. `DELETE /nearby-alerts/logs/{alertLogId}`
 *
 * 서버가 `deletedAt` 으로 소프트 삭제한다. 지운 기록은 목록 조회·확인 처리
 * 대상에서 빠지므로 **다른 기기에서도 다시 보이지 않는다** — 예전에 브라우저에
 * 숨겨 두던 방식(`lib/hiddenAlertLogs`)을 대체한다.
 *
 * ⚠️ **여러 건을 한 번에 지우는 엔드포인트는 없다.** 선택 삭제·모두 삭제는
 * 이 함수를 건수만큼 부른다(`deleteNearbyAlertLogs`).
 *
 * 지워도 "사용자·나무별 하루 1회" 중복 알림 방지에는 계속 쓰이므로, 지운 장소에
 * 다시 가도 그날 안에는 알림이 오지 않는다.
 *
 * 실패 코드: 404 `NEARBY_ALERT404`(없거나 내 것이 아닌 기록 — 서버가 둘을
 * 구분하지 않는다).
 */
export async function deleteNearbyAlertLog(alertLogId: number): Promise<void> {
  const { data } = await httpClient.delete<ApiResponse<null>>(
    `/nearby-alerts/logs/${alertLogId}`,
  );

  unwrapApiResponse(data);
}

/** 여러 건 삭제 결과 — 몇 건이 지워졌고 몇 건이 실패했는지. */
export interface BulkDeleteResult {
  deletedIds: number[];
  failedCount: number;
}

/**
 * 알림 기록 여러 건 삭제.
 *
 * 서버에 일괄 삭제가 없어 건별로 부른다. **한 건이 실패해도 나머지는 계속
 * 진행한다** — 이미 지워진 기록(404) 하나 때문에 나머지 삭제를 통째로 되돌리면
 * 사용자가 다시 골라야 한다. 성공한 id 만 돌려주고 실패 건수는 따로 알린다.
 */
export async function deleteNearbyAlertLogs(
  alertLogIds: number[],
): Promise<BulkDeleteResult> {
  const results = await Promise.allSettled(
    alertLogIds.map((id) => deleteNearbyAlertLog(id)),
  );

  const deletedIds = alertLogIds.filter(
    (_id, index) => results[index].status === 'fulfilled',
  );

  return { deletedIds, failedCount: alertLogIds.length - deletedIds.length };
}
