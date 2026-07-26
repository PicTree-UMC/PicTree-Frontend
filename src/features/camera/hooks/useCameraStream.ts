import { useEffect, useRef, useState } from 'react';

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
      } catch {
        if (!cancelled) setError('카메라를 사용할 수 없습니다. 권한을 확인해주세요.');
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
