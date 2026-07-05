import { useEffect, useRef, useState } from 'react';

// 입력값 없을 시, 서울시청 기준으로 호출
export function useKakaoMap(lat = 37.5665, lng = 126.9780, level = 3) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);

  useEffect(() => {
    const initMap = () => {
      if (!containerRef.current) return;
      setMap(new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level,
      }));
    };

    if (window.kakao?.maps) {
      initMap();
      return;
    }

    const existing = document.querySelector('script[src*="dapi.kakao.com/v2/maps"]');
    if (existing) {
      existing.addEventListener('load', () => window.kakao.maps.load(initMap));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${import.meta.env.VITE_KAKAO_MAP_APP_KEY}&autoload=false`;
    script.onload = () => window.kakao.maps.load(initMap);
    document.head.appendChild(script);
  }, [lat, lng, level]);

  return { containerRef, map };
}
