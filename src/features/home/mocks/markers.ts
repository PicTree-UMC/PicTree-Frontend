import type { MapMarkerData } from '../hooks/useMapMarkers';

/** 실제 데이터 연동 전까지 지도에 표시할 목업 마커. */
export const DEMO_MARKERS: MapMarkerData[] = [
  {
    id: 'fog-lane-park',
    lat: 37.5672,
    lng: 126.9772,
    emoji: '😊',
    label: '포그레인 공원',
    date: '2026-04-01',
    comment: '벚꽃 구경하기 좋은 곳',
    photo: 'https://picsum.photos/seed/fog-lane-park/600/800',
  },
  {
    id: 'oasis-meeting',
    lat: 37.566,
    lng: 126.9788,
    emoji: '😊',
    label: '오아이스 만난곳',
    date: '2026-04-01',
    comment: '갤러거 형제 자만추',
    photo: 'https://picsum.photos/seed/oasis-meeting/800/600',
  },
  {
    id: 'mart',
    lat: 37.5652,
    lng: 126.9768,
    emoji: '😊',
    label: '마트',
    date: '2026-03-25',
    comment: '장 보러 자주 가는 곳',
  },
  {
    id: 'pizza-place',
    lat: 37.5652,
    lng: 126.9792,
    emoji: '😊',
    label: '피자 맛집',
    date: '2026-03-20',
    comment: '고르곤졸라 피자 최고',
  },
];
