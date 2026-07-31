import type { FavoriteList } from '../types/favorite';

/**
 * 즐겨찾기 목데이터.
 *
 * 화면에 원래 하드코딩돼 있던 두 곳을 그대로 옮긴 것이다. 로그인·백엔드 없이도
 * 목록·정렬·제거 흐름을 확인할 수 있어야 해서 개발 환경 폴백으로 남긴다.
 *
 * `imageUrl` 을 한쪽만 채운 이유: 사진이 없는 항목의 회색 자리 표시가
 * 제대로 나오는지 같이 보려는 것이다.
 */
export const DEMO_FAVORITES: FavoriteList = {
  count: 2,
  favorites: [
    {
      treeId: 1,
      name: '오아시스 만난 곳',
      description: '길 가다가 오아시스 자만추',
      visitedAt: '2026-03-30',
      imageUrl: 'https://picsum.photos/seed/oasis-meeting/240',
    },
    {
      treeId: 2,
      name: '마트',
      description: '물사러 갔는데 마트에 공짜 정수기가 있었따',
      visitedAt: '2026-03-28',
      imageUrl: null,
    },
  ],
};
