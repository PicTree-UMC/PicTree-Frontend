import { Journey } from '../types/journey';

/**
 * 저장된 동선 목데이터.
 *
 * 동선 탭은 이제 칩 셀렉터 + 로드맵으로 그려지므로, 칩이 서로 구분되도록
 * 제목·날짜를 다르게 두고 장소 수도 동선마다 다르게 준다.
 * 로드맵 노드는 `places` 순서대로 그려지고, 노드 썸네일은 `photos` 중
 * `placeName` 이 일치하는 사진의 `url` 로 채운다(없으면 플레이스홀더 아이콘).
 */
export const journeyData: Journey[] = [
  {
    id: 1,
    title: '성수 카페 투어',
    date: '2026년 4월 1일',
    savedAt: '2026.4.2',
    places: [
      { id: 1, name: '포그레인 공원' },
      { id: 2, name: '오아시스 만난 곳' },
      { id: 3, name: '성수 연방' },
      { id: 4, name: '대림창고' },
    ],
    photos: [
      { id: 1, placeName: '포그레인 공원' },
      { id: 2, placeName: '오아시스 만난 곳' },
      { id: 3, placeName: '성수 연방' },
      { id: 4, placeName: '대림창고' },
    ],
  },
  {
    id: 2,
    title: '북촌 산책',
    date: '2026년 3월 28일',
    savedAt: '2026.3.29',
    places: [
      { id: 1, name: '북촌 한옥마을' },
      { id: 2, name: '가회동 성당' },
      { id: 3, name: '삼청동 길' },
    ],
    photos: [
      { id: 1, placeName: '북촌 한옥마을' },
      { id: 2, placeName: '삼청동 길' },
    ],
  },
  {
    id: 3,
    title: '여의도 벚꽃',
    date: '2026년 4월 5일',
    savedAt: '2026.4.5',
    places: [
      { id: 1, name: '윤중로' },
      { id: 2, name: '여의도 한강공원' },
      { id: 3, name: '샛강생태공원' },
      { id: 4, name: '여의나루역' },
      { id: 5, name: '더현대 서울' },
    ],
    photos: [
      { id: 1, placeName: '윤중로' },
      { id: 2, placeName: '여의도 한강공원' },
      { id: 3, placeName: '더현대 서울' },
    ],
  },
];
