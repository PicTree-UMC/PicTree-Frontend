import { Journey } from '../types/journey';
import { journeyData } from '../mocks/journeyData';

/**
 * 동선 API 레이어.
 *
 * 지금은 목데이터를 반환하지만, 실 연동 시 이 파일 안의 함수 본문만
 * httpClient 호출로 교체하면 된다. 위층(훅·페이지)은 건드리지 않는다.
 *   예) const { data } = await httpClient.get<Journey[]>('/routes'); return data;
 *
 * ⚠️ API 경로는 /routes 지만 코드 용어는 Journey 로 유지한다 (개명은 별도 브랜치).
 * ⚠️ 응답 래퍼·날짜 포맷·사진 필드명은 백엔드 스펙 확정 후 매핑 (HANDOFF 5절).
 */

/** 실 네트워크 지연을 흉내 내 로딩·에러 UI 가 실제로 동작하게 한다. */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 목의 "가짜 서버 상태". 원본(journeyData)을 복제해 들고 있으므로
 * 삭제·이름변경이 세션 동안 반영되고, 새로고침하면 원본으로 리셋된다.
 * 실 연동 시 이 배열은 통째로 제거된다.
 */
let journeys: Journey[] = [...journeyData];

/** 저장된 동선 목록 조회 */
export const getJourneys = async (): Promise<Journey[]> => {
  // 교체: const { data } = await httpClient.get<Journey[]>('/routes'); return data;
  await delay(300);
  return journeys;
};

/** 동선 1건 삭제 */
export const deleteJourney = async (id: number): Promise<void> => {
  // 교체: await httpClient.delete(`/routes/${id}`);
  await delay(300);
  journeys = journeys.filter((journey) => journey.id !== id);
};

/** 동선 이름 변경 */
export const renameJourney = async (id: number, title: string): Promise<void> => {
  // 교체: await httpClient.patch(`/routes/${id}`, { title });
  await delay(300);
  journeys = journeys.map((journey) =>
    journey.id === id ? { ...journey, title } : journey,
  );
};
