import { useEffect, useRef, useState } from 'react';

export type FacingMode = 'user' | 'environment';

/** getUserMedia 로 카메라 스트림을 열고, unmount/facingMode 변경 시 트랙을 정리한다. */
export function useCameraStream(facingMode: FacingMode) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        if (!cancelled) setError('카메라를 사용할 수 없습니다. 권한을 확인해주세요.');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  return { videoRef, error };
}
