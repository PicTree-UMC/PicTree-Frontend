import { useEffect, useRef, useState } from 'react';

import {
  CAMERA_UNSUPPORTED_MESSAGE,
  getCameraErrorMessage,
  isCameraApiAvailable,
} from '../lib/cameraError';

export type FacingMode = 'user' | 'environment';

// OBS 등 가상 카메라 라벨 패턴. 데스크톱에서 기본 장치로 잡히는 걸 걸러낸다.
const VIRTUAL_CAMERA_RE = /obs|virtual|manycam|snap camera|xsplit|droidcam/i;

/** getUserMedia 로 카메라 스트림을 열고, unmount/facingMode 변경 시 트랙을 정리한다. */
export function useCameraStream(facingMode: FacingMode) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    const constraintsFor = (extra?: MediaTrackConstraints): MediaStreamConstraints => ({
      video: {
        facingMode,
        // 기기가 지원하는 최대 해상도를 요청 (브라우저가 지원 가능한 값으로 자동 조정)
        width: { ideal: 4096 },
        height: { ideal: 4096 },
        ...extra,
      },
    });

    const open = async () => {
      // http 로 열었거나 아주 낡은 브라우저면 `mediaDevices` 자체가 없다. 그대로 부르면
      // TypeError 로 떨어져 "잠시 후 다시" 같은 틀린 안내가 나가므로 여기서 가른다.
      if (!isCameraApiAvailable()) {
        setError(CAMERA_UNSUPPORTED_MESSAGE);
        return;
      }

      try {
        let stream = await navigator.mediaDevices.getUserMedia(constraintsFor());
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // 데스크톱에서 OBS 같은 가상 카메라가 잡히면 실제 웹캠으로 교체한다.
        // (라벨은 권한 획득 후에만 노출되므로 스트림을 먼저 연 뒤 판별한다. 모바일엔 가상 카메라가 없어 그대로 통과)
        const track = stream.getVideoTracks()[0];
        if (track && VIRTUAL_CAMERA_RE.test(track.label)) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const realCamera = devices.find(
            (device) =>
              device.kind === 'videoinput' &&
              device.label &&
              !VIRTUAL_CAMERA_RE.test(device.label),
          );
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          if (realCamera) {
            stream.getTracks().forEach((t) => t.stop());
            stream = await navigator.mediaDevices.getUserMedia(
              constraintsFor({ deviceId: { exact: realCamera.deviceId } }),
            );
            if (cancelled) {
              stream.getTracks().forEach((t) => t.stop());
              return;
            }
          }
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        // 원인에 따라 할 일이 다르다 — 설정에서 켜기 / 그 앱 닫기 / 할 수 있는 것 없음.
        // 문구 판정은 `lib/cameraError.ts` 가 한 자리에서 한다(#271).
        if (!cancelled) setError(getCameraErrorMessage(err));
      }
    };

    open();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  return { videoRef, error };
}
