import { RoutePlace } from '../types/route';

/**
 * 실제 데이터 연동 전까지 동선 보기 화면에 표시할 목업 장소. 배열 순서가 곧 경로 순서.
 *
 * 날짜는 화면설계서 캘린더 시안과 맞춰 뒀다(4/29 3곳 · 4/30 2곳 · 5/1 2곳 · 5/3 3곳 · 5/9 2곳).
 * 캘린더가 '방문한 날짜'만 고를 수 있게 하므로, 목 날짜가 과거로 멀면 화면을 확인하기 어렵다.
 */
const baseRoutePlaces: RoutePlace[] = [
  { id: 1, name: '초코베이션 공원', lat: 37.5672, lng: 126.9772, date: '2026-04-29' },
  { id: 2, name: '지속가능 정원', lat: 37.566, lng: 126.9788, date: '2026-04-29' },
  { id: 3, name: '메아지방', lat: 37.5652, lng: 126.9768, date: '2026-04-29' },
  { id: 4, name: '식당', lat: 37.5648, lng: 126.9792, date: '2026-04-30' },
  { id: 5, name: '인쇄소&선물', lat: 37.5645, lng: 126.978, date: '2026-04-30' },
  { id: 6, name: '한옥 카페', lat: 37.5701, lng: 126.9835, date: '2026-05-01' },
  { id: 7, name: '광화문 광장', lat: 37.5721, lng: 126.9769, date: '2026-05-01' },
  { id: 8, name: '남산 전망대', lat: 37.5512, lng: 126.9882, date: '2026-05-03' },
  { id: 9, name: '명동 거리', lat: 37.5636, lng: 126.9822, date: '2026-05-03' },
  { id: 10, name: '청계천 산책로', lat: 37.5691, lng: 126.9791, date: '2026-05-03' },
  { id: 11, name: '서촌 책방', lat: 37.5776, lng: 126.9708, date: '2026-05-09' },
  { id: 12, name: '경복궁', lat: 37.5796, lng: 126.977, date: '2026-05-09' },
];

/**
 * 개발 중 콘솔에서 날짜를 더 꽂아보기 위한 구멍. **실 API 로 교체될 때 같이 사라진다.**
 *
 * 화면(캘린더·20개 한도·지도 축소)을 흔들어보려면 날짜 조합을 자주 바꿔야 하는데,
 * 목 파일을 매번 고치면 저장할 때마다 HMR 이 돌고 diff 도 지저분해진다.
 *
 * ```js
 * localStorage.setItem('pictree.mockRoutePlacesExtra', JSON.stringify([
 *   { id: 1001, name: '뚝섬 한강공원', lat: 37.5299, lng: 127.0668, date: '2026-06-06' },
 * ]));
 * location.reload();
 * ```
 */
function readExtraPlaces(): RoutePlace[] {
  if (!import.meta.env.DEV) return [];

  try {
    const raw = localStorage.getItem('pictree.mockRoutePlacesExtra');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return []; // 손으로 붙여넣는 값이라 깨진 JSON 이 들어오면 그냥 무시한다
  }
}

/**
 * 실제 데이터 연동 전까지 동선 보기 화면에 표시할 목업 장소. **배열 순서가 곧 경로 순서**라
 * 같은 날짜의 장소가 흩어지지 않도록 날짜순으로 모은다(같은 날짜 안의 순서는 그대로 유지).
 */
export const routePlaces: RoutePlace[] = [...baseRoutePlaces, ...readExtraPlaces()].sort((a, b) =>
  a.date.localeCompare(b.date),
);
