import { create } from 'zustand';
import type { GeoCoords } from '@/shared/hooks/useGeolocation';

/**
 * 마지막으로 성공한 측위를 화면 밖에 보관한다.
 *
 * `useGeolocation` 은 훅이라 좌표를 컴포넌트 state 에 든다 — **화면을 떠나면 좌표도 같이
 * 사라져서**, 홈 → 카메라 → 홈 한 바퀴에 사실상 같은 좌표를 세 번 새로 측위했다(#251).
 * 여기 두면 화면이 바뀌어도 남아서 다음 화면이 이미 아는 값으로 바로 시작한다.
 *
 * ⚠️ **`useGeolocation` 을 대신하는 자리가 아니다.** 요청·추적·정확도 필터는 그대로 훅에
 * 있고 이 스토어는 **결과만** 든다. 훅을 쓰는 곳이 열 군데가 넘어 걷어내면 diff 가 커진다.
 *
 * 자리가 `shared/lib/` 인 이유는 `kakaoSdkStore` 와 같다 — 기기·외부 자원의 상태를 화면
 * 여럿이 나눠 쓰는 모양이라 도메인 어디에도 속하지 않는다. (`src/store/` 는 비어 있지만
 * 스토어의 집이 아니다. 넷 모두 쓰는 자리 옆에 있다.)
 */

export interface LocationFix {
  coords: GeoCoords;
  /**
   * 측위 시각(`GeolocationPosition.timestamp`).
   *
   * **좌표만 두면 신선도를 알 수 없어서 함께 든다.** 낡은 좌표는 지도를 그리는 데는 써도
   * 되지만 기록의 위치로 쓰면 사진 찍은 곳과 어긋난다 — 그 둘을 가르려면 시각이 필요하다.
   */
  timestamp: number;
}

interface GeolocationStoreState {
  fix: LocationFix | null;
  setFix: (fix: LocationFix) => void;
  clearFix: () => void;
}

export const useGeolocationStore = create<GeolocationStoreState>((set) => ({
  fix: null,
  setFix: (fix) => set({ fix }),
  /**
   * 권한이 거부됐을 때 부른다.
   *
   * 안 비우면 다른 화면이 "마지막으로 알던 위치" 로 계속 그려서, **권한을 껐는데도 위치가
   * 남아 있는 것처럼 보인다.** 훅이 자기 state 의 좌표를 비우는 것과 짝이다.
   */
  clearFix: () => set({ fix: null }),
}));
