import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useCameraStream, type FacingMode } from './hooks/useCameraStream';
import { captureFrame } from './lib/captureFrame';

const ZOOM_STEPS = [1, 1.5, 2] as const;

export function CameraPage() {
  const navigate = useNavigate();
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [zoom, setZoom] = useState<number>(ZOOM_STEPS[0]);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const { videoRef, error } = useCameraStream(facingMode);

  const handleCapture = () => {
    if (!videoRef.current) return;
    setCapturedPhoto(captureFrame(videoRef.current, zoom));
  };

  const handleRetake = () => setCapturedPhoto(null);
  const handleUse = () => navigate(ROUTES.record, { state: { photo: capturedPhoto } });
  const handleSkip = () => navigate(ROUTES.record, { state: { photo: null } });
  const toggleFacing = () =>
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  const cycleZoom = () =>
    setZoom((prev) => ZOOM_STEPS[(ZOOM_STEPS.indexOf(prev as (typeof ZOOM_STEPS)[number]) + 1) % ZOOM_STEPS.length]);

  if (capturedPhoto) {
    return (
      <div className="flex h-screen w-full flex-col bg-black">
        <header className="flex h-11 items-center justify-center text-sm font-medium text-white">
          사진 촬영
        </header>

        <div className="flex-1 overflow-hidden">
          <img src={capturedPhoto} alt="촬영된 사진" className="h-full w-full object-cover" />
        </div>

        <div className="flex items-center justify-center gap-16 bg-black py-6">
          <button onClick={handleRetake} className="flex flex-col items-center gap-2 text-white">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-600">
              <RetakeIcon />
            </span>
            <span className="text-xs">다시찍기</span>
          </button>
          <button onClick={handleUse} className="flex flex-col items-center gap-2 text-white">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pictree-500">
              <CheckIcon />
            </span>
            <span className="text-xs">사용하기</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-black">
      <header className="flex h-11 items-center justify-center text-lg font-bold text-white">
        PicTree
      </header>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ transform: `scale(${zoom})` }}
          className="h-full w-full origin-center object-cover"
        />
        {error && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-white">
            {error}
          </p>
        )}
        <button
          onClick={cycleZoom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white"
        >
          {zoom.toFixed(1)}x
        </button>
      </div>

      <div className="flex flex-col gap-3 bg-black pb-2 pt-4">
        <div className="flex items-center justify-around px-6">
          <span className="flex h-11 w-11 items-center justify-center text-neutral-500" aria-hidden>
            <FlashOffIcon />
          </span>
          <button
            onClick={handleCapture}
            aria-label="촬영"
            className="h-16 w-16 rounded-full border-4 border-white bg-white"
          />
          <button onClick={toggleFacing} aria-label="전/후면 전환" className="flex h-11 w-11 items-center justify-center text-white">
            <SwitchCameraIcon />
          </button>
        </div>
        <button
          onClick={handleSkip}
          className="w-full bg-neutral-800 py-3 text-sm text-neutral-300"
        >
          사진 없이 기록하기
        </button>
      </div>
    </div>
  );
}

function FlashOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4l16 16" />
    </svg>
  );
}

function SwitchCameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h5M20 20v-5h-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 15a8 8 0 0014.9 2.5M19.5 9a8 8 0 00-14.9-2.5" />
    </svg>
  );
}

function RetakeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h5M4 9a8 8 0 1015-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
