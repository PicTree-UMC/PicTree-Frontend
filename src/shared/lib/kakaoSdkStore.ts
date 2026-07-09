import { create } from 'zustand';

/**
 * 카카오맵 SDK는 앱 전체에서 단 한 번만 로드되어야 하는 전역 리소스.
 * status 로 로딩 상태를 전역에서 공유해, 여러 컴포넌트가 동시에 load() 를 호출해도
 * 스크립트 태그/리스너가 중복 생성되지 않도록 한다.
 */

type KakaoSdkStatus = 'idle' | 'loading' | 'loaded';

interface KakaoSdkState {
  status: KakaoSdkStatus;
  load: () => void;
}

export const useKakaoSdkStore = create<KakaoSdkState>((set, get) => ({
  status: 'idle',
  load: () => {
    if (get().status !== 'idle') return; // 이미 로딩 중이거나 끝났으면 중복 실행 방지

    if (window.kakao?.maps) {
      set({ status: 'loaded' });
      return;
    }

    set({ status: 'loading' });
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_APP_KEY}&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => set({ status: 'loaded' }));
    document.head.appendChild(script);
  },
}));
