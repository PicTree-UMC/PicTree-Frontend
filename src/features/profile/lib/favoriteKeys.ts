/**
 * 즐겨찾기 목록 쿼리 키.
 *
 * ⚠️ **`useFavorites` 에 있던 것을 여기로 뺐다 — 순환 참조를 피하려고다.**
 * `hooks/useFavorites` 는 지도 목록을 함께 무효화하느라 `home/hooks/useTrees` 의
 * `treeKeys` 를 가져다 쓴다. 그런데 지도의 즐겨찾기 토글(`useToggleFavorite`)도
 * 반대로 이 키가 필요해져서, 그대로 두면 두 모듈이 서로를 부르게 된다 — ESM 은
 * 그 고리에서 먼저 평가되는 쪽의 const 를 TDZ 로 만들어 앱이 뜨지도 못한다.
 *
 * 아무것도 import 하지 않는 이 파일에 두면 양쪽 다 안전하게 가져갈 수 있다.
 * 여기에 다른 것을 import 하지 말 것 — 그 순간 고리가 되살아난다.
 */
export const favoriteKeys = {
  all: ['favorites'] as const,
};
