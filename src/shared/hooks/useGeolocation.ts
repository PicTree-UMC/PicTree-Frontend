import { useCallback, useEffect, useState } from 'react';

export interface GeoCoords {
  latitude: number;
  longitude: number;
}

interface GeolocationState {
  coords: GeoCoords | null;
  error: string | null;
  loading: boolean;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 30000,
};

/**
 * 기기의 현재 위치를 가져오는 훅.
 * 마운트 시 한 번 위치를 요청하고, request() 로 재시도할 수 있다.
 * 홈 지도의 "현재 위치 표시"와 장소 등록(좌표 필요)에서 함께 쓴다.
 */
export function useGeolocation(options: PositionOptions = DEFAULT_OPTIONS) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: true,
  });

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState({ coords: null, error: '이 기기에서는 위치를 사용할 수 없어요.', loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          loading: false,
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? '위치 권한이 거부되어 현재 위치를 표시할 수 없어요.'
            : '현재 위치를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.';
        setState({ coords: null, error: message, loading: false });
      },
      options,
    );
  }, [options]);

  useEffect(() => {
    request();
  }, [request]);

  return { ...state, request };
}
