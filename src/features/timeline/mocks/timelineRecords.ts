import type { TimelineRecord } from '../types/timeline.types';

/**
 * 오늘을 기준으로 N일 전 특정 시각의 ISO 문자열을 만든다.
 *
 * 시안의 "오늘 · 4월 1일 (수) / 어제 / 2일 전" 그룹 라벨은 실행 시점 기준으로
 * 계산되므로, 목 데이터도 고정 날짜가 아니라 상대 날짜여야 언제 실행해도
 * 시안과 같은 그룹으로 묶인다.
 */
const daysAgoAt = (daysAgo: number, hour: number, minute: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);

  return date.toISOString();
};

/**
 * 실제 데이터 연동 전까지 타임라인에 표시할 목업 기록.
 *
 * 시안(타임라인_무료, Figma 1087:25877)의 5개 기록을 그대로 옮긴 것이다 —
 * 장소명·한줄평·시각이 모두 시안과 일치하며, 헤더의 "총 5개의 기록" 도 이 개수에서 나온다.
 * 지도(`home/mocks/markers.ts`)와 같은 역할을 타임라인에서 하는 파일이다.
 *
 * `createdAt`(등록 시각)은 일부러 `recordedAt`(방문 시각)과 순서를 어긋나게 넣었다.
 * 둘이 같으면 "최신순 / 등록순" 정렬이 똑같이 보여서 확인이 안 된다 —
 * 지난 여행을 나중에 올리는 실제 상황을 흉내 낸 것이다.
 */
export const DEMO_TIMELINE_RECORDS: TimelineRecord[] = [
  {
    id: 'oasis-meeting',
    placeName: '오아시스 만난 곳',
    comment: '갤러거 형제 자만추',
    recordedAt: daysAgoAt(0, 9, 30),
    createdAt: daysAgoAt(0, 21, 10),
    thumbnailUrl: 'https://picsum.photos/seed/oasis-meeting/240',
  },
  {
    id: 'shopping',
    placeName: '쇼핑',
    comment: '기념품 구매',
    recordedAt: daysAgoAt(0, 10, 20),
    createdAt: daysAgoAt(0, 10, 25),
    thumbnailUrl: 'https://picsum.photos/seed/shopping/240',
  },
  {
    id: 'morning-meal',
    placeName: '아침밥 구매',
    comment: '피자 구매',
    recordedAt: daysAgoAt(1, 9, 20),
    createdAt: daysAgoAt(1, 9, 40),
    thumbnailUrl: 'https://picsum.photos/seed/morning-meal/240',
  },
  {
    id: 'homeless-meeting',
    placeName: '노숙자 만난 곳',
    comment: '지나가다가 1파운드 기부',
    recordedAt: daysAgoAt(1, 10, 30),
    // 이틀 뒤에 몰아 올린 기록 — 등록순에서는 가장 최근으로 올라온다
    createdAt: daysAgoAt(0, 23, 40),
    thumbnailUrl: 'https://picsum.photos/seed/homeless-meeting/240',
  },
  {
    id: 'slipped-place',
    placeName: '넘어졌던 곳',
    comment: '바닥이 미끄러웠음',
    recordedAt: daysAgoAt(2, 10, 30),
    createdAt: daysAgoAt(2, 11, 0),
    thumbnailUrl: 'https://picsum.photos/seed/slipped-place/240',
  },
];
