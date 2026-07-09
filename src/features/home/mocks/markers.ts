import type { MapMarkerData } from '../hooks/useMapMarkers';

/** 실제 데이터 연동 전까지 지도에 표시할 목업 마커. */
export const DEMO_MARKERS: MapMarkerData[] = [
  {
    lat: 37.5672,
    lng: 126.9772,
    label: { variant: 'pin', emoji: '😊', label: '포그레인 공원' },
  },
  {
    lat: 37.5665,
    lng: 126.978,
    label: {
      variant: 'place',
      title: '포그 레인 공원',
      subtitle: 'Fog Lane Park',
      caption: '최근에 본 관심 장소',
    },
  },
  {
    lat: 37.566,
    lng: 126.9788,
    label: { variant: 'pin', emoji: '😊', label: '오아이스 만난곳' },
  },
  {
    lat: 37.5652,
    lng: 126.9768,
    label: { variant: 'pin', emoji: '😊', label: '마트' },
  },
  {
    lat: 37.5652,
    lng: 126.9792,
    label: { variant: 'pin', emoji: '😊', label: '피자 맛집' },
  },
];
