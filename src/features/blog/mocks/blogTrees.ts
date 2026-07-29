import type { BlogTreeRecord } from '../types/blog';

/**
 * 실제 기간별 나무 조회 API가 생기면 이 배열을 서버 응답으로 교체한다.
 * 필드명은 현재 공유된 나무 등록 API RequestBody를 기준으로 맞췄다.
 */
export const MOCK_BLOG_TREES: BlogTreeRecord[] = [
  {
    treeId: 1,
    name: '포그레인 공원',
    description: '오아시스 형제가 축구하던 그곳! 근처 맛집에서 햄버거를 사 와 피크닉을 즐겼다.',
    latitude: 37.5672,
    longitude: 126.9772,
    address: '서울시 중구 세종대로 110',
    mood: '😍',
    defaultImage: 'https://picsum.photos/seed/fog-lane-park/480/480',
    createdAt: '2026-03-31T11:20:00+09:00',
  },
  {
    treeId: 2,
    name: '피자 맛집',
    description: '산책하다 발견한 작은 피자 가게. 고르곤졸라 피자와 따뜻한 분위기가 기억에 남았다.',
    latitude: 37.5652,
    longitude: 126.9792,
    address: '서울시 중구 을지로 42',
    mood: '🥳',
    defaultImage: 'https://picsum.photos/seed/pizza-place/480/480',
    createdAt: '2026-03-31T13:10:00+09:00',
  },
  {
    treeId: 3,
    name: '마트',
    description: '여행 중 필요한 물과 간식을 샀다. 낯선 동네의 평범한 마트도 여행의 한 장면이 되었다.',
    latitude: 37.5652,
    longitude: 126.9768,
    address: '서울시 중구 남대문로 15',
    mood: '😌',
    defaultImage: 'https://picsum.photos/seed/local-mart/480/480',
    createdAt: '2026-03-31T16:35:00+09:00',
  },
  {
    treeId: 4,
    name: '산책',
    description: '해 질 무렵 천천히 걸었다. 바쁜 하루 사이 잠깐 숨을 고를 수 있었던 길이었다.',
    latitude: 37.5643,
    longitude: 126.9758,
    address: '서울시 중구 청계천로 20',
    mood: '😌',
    defaultImage: 'https://picsum.photos/seed/evening-walk/480/480',
    createdAt: '2026-04-01T18:20:00+09:00',
  },
  {
    treeId: 5,
    name: '아침밥 구매',
    description: '아침 일찍 동네 빵집에 들러 갓 나온 빵과 커피를 샀다.',
    latitude: 37.5667,
    longitude: 126.9801,
    address: '서울시 중구 무교로 9',
    mood: '😊',
    defaultImage: 'https://picsum.photos/seed/morning-bakery/480/480',
    createdAt: '2026-04-01T08:30:00+09:00',
  },
  {
    treeId: 6,
    name: '오아시스 만난 곳',
    description: '좋아하던 음악을 들으며 우연히 발견한 장소. 여행 마지막을 특별하게 만들어 주었다.',
    latitude: 37.566,
    longitude: 126.9788,
    address: '서울시 중구 덕수궁길 5',
    mood: '🥳',
    defaultImage: 'https://picsum.photos/seed/oasis-meeting/480/480',
    createdAt: '2026-04-01T19:10:00+09:00',
  },
];
