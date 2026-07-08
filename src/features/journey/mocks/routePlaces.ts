import { RoutePlace } from '../types/route';

/** 실제 데이터 연동 전까지 동선 보기 화면에 표시할 목업 장소. 배열 순서가 곧 경로 순서. */
export const routePlaces: RoutePlace[] = [
  { id: 1, name: '초코베이션 공원', lat: 37.5672, lng: 126.9772, date: '2024-03-31' },
  { id: 2, name: '지속가능 정원', lat: 37.566, lng: 126.9788, date: '2024-03-31' },
  { id: 3, name: '메아지방', lat: 37.5652, lng: 126.9768, date: '2024-04-01' },
  { id: 4, name: '식당', lat: 37.5652, lng: 126.9792, date: '2024-04-01' },
  { id: 5, name: '인쇄소&선물', lat: 37.5645, lng: 126.978, date: '2024-04-01' },
];
