import { useEffect, useRef, useState } from 'react';
import { useKakaoSdkStore } from '@/shared/lib/kakaoSdkStore';

// 입력값 없을 시, 서울시청 기준으로 호출
export function useKakaoMap(lat = 37.5665, lng = 126.9780, level = 3) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const status = useKakaoSdkStore((s) => s.status);
  const load = useKakaoSdkStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (status !== 'loaded' || !containerRef.current) return;

    setMap(
      new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level,
      }),
    );

    return () => {
      setMap(null); // 컴포넌트가 사라지면 이 map 인스턴스 참조도 함께 해제
    };
  }, [status, lat, lng, level]);
  
  // 컨테이너 크기가 바뀌면(시트/키보드 등장 등) 카카오맵은 새로 노출된 영역을 회색 빈 타일로 남겨두기 떄문에 타일을 다시 그려줌
  useEffect(() => {
    const container = containerRef.current;
    if (!map || !container) return;

    const observer = new ResizeObserver(() =>
      (map as kakao.maps.Map & { relayout: () => void }).relayout(),
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return { containerRef, map };
}
