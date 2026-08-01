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

export interface UseGeolocationOptions extends PositionOptions {
  /**
   * true 면 `watchPosition` 으로 계속 추적한다(지도처럼 이동을 따라가야 하는 화면).
   * 기본값 false 는 마운트 시 1회 조회 — 촬영 시점의 좌표 하나만 있으면 되는
   * 카메라 화면은 움직이는 좌표가 오히려 방해가 되고, 추적은 배터리도 쓴다.
   */
  watch?: boolean;
}

/**
 * `maximumAge` 기본값.
 *
 * 예전 값 30초는 실시간 추적과 맞지 않는다 — 브라우저가 30초 묵은 좌표를 그대로
 * 돌려줄 수 있어 걸어서 이동한 거리만큼 어긋난다. 매번 새 측위를 하면(0) 첫 응답이
 * 느려지므로, 연속 호출만 아껴주는 정도로 짧게 잡는다.
 */
const DEFAULT_MAXIMUM_AGE = 5000;

const isSupported = () => typeof navigator !== 'undefined' && 'geolocation' in navigator;

const UNSUPPORTED_MESSAGE = '이 기기에서는 위치를 사용할 수 없어요.';

/**
 * 기기의 현재 위치를 가져오는 훅.
 *
 * 기본은 마운트 시 1회 조회이고, `request()` 로 다시 요청할 수 있다.
 * `{ watch: true }` 를 주면 위치가 바뀔 때마다 갱신된다.
 * 홈 지도의 "현재 위치 표시"와 장소 등록(좌표 필요)에서 함께 쓴다.
 */
export function useGeolocation(options: UseGeolocationOptions = {}) {
  /*
   * 옵션 객체를 통째로 의존성에 걸면 호출부가 `useGeolocation({ watch: true })` 처럼
   * 리터럴을 넘길 때 매 렌더마다 새 객체가 되어 watch 가 계속 다시 걸린다.
   * 원시값으로 풀어서 값이 실제로 바뀔 때만 반응하게 한다.
   */
  const {
    watch = false,
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = DEFAULT_MAXIMUM_AGE,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coords: null,
    error: null,
    loading: true,
  });

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState({
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      error: null,
      loading: false,
    });
  }, []);

  /*
   * 실패해도 이미 받아둔 좌표는 남긴다. 추적 중에는 터널·지하처럼 잠깐 측위가
   * 끊기는 구간에서 에러가 오는데, 그때마다 좌표를 비우면 지도의 내 위치 점이
   * 깜빡이며 사라진다. 마지막으로 알던 위치를 두는 편이 낫다.
   * 권한이 거부된 경우만 예외 — 더 이상 위치를 보여줄 근거가 없다.
   */
  const handleError = useCallback((error: GeolocationPositionError) => {
    const denied = error.code === error.PERMISSION_DENIED;
    setState((prev) => ({
      coords: denied ? null : prev.coords,
      error: denied
        ? '위치 권한이 거부되어 현재 위치를 표시할 수 없어요.'
        : '현재 위치를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.',
      loading: false,
    }));
  }, []);

  /** 1회 조회. watch 모드에서도 수동 재시도로 쓸 수 있다. */
  const request = useCallback(() => {
    if (!isSupported()) {
      setState({ coords: null, error: UNSUPPORTED_MESSAGE, loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  useEffect(() => {
    if (!watch) {
      request();
      return;
    }

    if (!isSupported()) {
      setState({ coords: null, error: UNSUPPORTED_MESSAGE, loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });

    // 화면을 떠나면 추적을 멈춘다. 안 끊으면 백그라운드에서 계속 측위해 배터리를 쓴다.
    return () => navigator.geolocation.clearWatch(watchId);
  }, [watch, request, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  return { ...state, request };
}
