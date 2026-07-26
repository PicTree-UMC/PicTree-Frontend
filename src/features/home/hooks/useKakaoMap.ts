import { useEffect, useRef, useState } from 'react';
import { useKakaoSdkStore } from '@/shared/lib/kakaoSdkStore';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

/** 좌표가 주어지지 않을 때의 기본 중심(서울시청). */
const DEFAULT_CENTER: LatLngLiteral = { lat: 37.5665, lng: 126.978 };

/**
 * 카카오맵을 생성한다.
 * center 가 null 이면(현재 위치 확인 중) 지도를 아직 만들지 않고 대기하고,
 * 좌표가 정해지면 그 위치에서 지도를 연다(초기 위치 튐 방지).
 */
export function useKakaoMap(center: LatLngLiteral | null = DEFAULT_CENTER, level = 3) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const status = useKakaoSdkStore((s) => s.status);
  const load = useKakaoSdkStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (status !== 'loaded' || !containerRef.current || !center) return;

    setMap(
      new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      }),
    );

    return () => {
      setMap(null); // 컴포넌트가 사라지면 이 map 인스턴스 참조도 함께 해제
    };
    // center 는 위치 확인 후 한 번만 정해지므로 객체 식별자 대신 lat/lng 값으로 의존성을 건다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, center?.lat, center?.lng, level]);
  
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
