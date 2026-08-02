import { useCallback, useEffect, useRef, useState } from 'react';

export interface GeoCoords {
  latitude: number;
  longitude: number;
  /**
   * 이 좌표의 신뢰반경(m). 기기가 스스로 추정한 값이지 실측 오차가 아니다.
   *
   * 사용자가 지도에서 직접 찍은 좌표에는 없다 — 그래서 optional 이다.
   * `undefined` 는 "정확도를 모른다"가 아니라 "GPS 가 준 값이 아니다"로 읽는다.
   */
  accuracy?: number;
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

/**
 * 이 값을 넘는 신뢰반경(m)이면 "부정확"으로 보고 사용자에게 수동 지정을 권한다.
 *
 * 실외 GPS 는 보통 5~20m, 지하에서 Wi-Fi 측위로 내려앉으면 30~150m, 기지국까지
 * 떨어지면 수백 m 가 나온다. 30 은 그 첫 경계다.
 *
 * ⚠️ 도심 빌딩숲에서는 실외에서도 20~50m 가 나오므로 **오탐이 있다.** 그래서 이
 * 판정으로 좌표를 자동으로 갈아끼우지 않고, 권하기만 하고 결정은 사용자가 한다.
 * (실기기 실측 전까지는 임시값 — TROUBLESHOOTING 에 실측치를 남길 것)
 */
export const LOW_ACCURACY_THRESHOLD_M = 30;

/**
 * 직전 좌표보다 정확도가 이 배수 이상 나빠지고, 그것이 아래 시간(ms) 안에
 * 일어나면 새 좌표를 버린다 — 지하 진입 순간 점이 수백 m 튀는 것을 막는다.
 * 창을 짧게 두는 이유는, 오래 붙들면 실제로 이동했을 때 따라가지 못해서다.
 */
const ACCURACY_REGRESSION_RATIO = 3;
const ACCURACY_REGRESSION_WINDOW_MS = 10000;

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

  /** 마지막으로 받아들인 측위의 정확도·시각. 아래 역행 필터의 기준점. */
  const lastFixRef = useRef<{ accuracy: number; timestamp: number } | null>(null);

  const handleSuccess = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      const last = lastFixRef.current;

      /*
       * 정확도가 갑자기 크게 나빠진 좌표는 버린다.
       *
       * 지하로 내려가면 브라우저는 에러를 주지 않는다 — GPS 대신 Wi-Fi·기지국 측위로
       * 조용히 내려앉아 수백 m 떨어진 좌표를 '성공'으로 돌려준다. 그래서 handleError
       * 의 방어가 여기엔 안 먹고, 그대로 받으면 내 위치 점이 순간이동한다.
       *
       * 추적 모드에서만 건다. 1회 조회에서 버리면 뒤이어 올 좌표가 없어 영영 로딩이다.
       */
      const regressed =
        watch &&
        last !== null &&
        last.accuracy > 0 &&
        accuracy > last.accuracy * ACCURACY_REGRESSION_RATIO &&
        position.timestamp - last.timestamp < ACCURACY_REGRESSION_WINDOW_MS;

      if (regressed) {
        // 좌표는 직전 것을 유지하되 로딩은 푼다 — 응답 자체는 왔으므로.
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      lastFixRef.current = { accuracy, timestamp: position.timestamp };
      setState({
        coords: { latitude, longitude, accuracy },
        error: null,
        loading: false,
      });
    },
    [watch],
  );

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
