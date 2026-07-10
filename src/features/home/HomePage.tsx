import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useKakaoMap } from './hooks/useKakaoMap';
import { useMapMarkers } from './hooks/useMapMarkers';
import { JourneyBanner } from './components/JourneyBanner';
import { DEMO_MARKERS } from './mocks/markers';

export function HomePage() {
  const navigate = useNavigate();
  const { containerRef, map } = useKakaoMap(37.5665, 126.978, 3);
  useMapMarkers(map, DEMO_MARKERS);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 카카오맵 */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* 동선 추가 알림 카드 */}
      <JourneyBanner placeCount={0} />

      {/* 카메라 버튼 */}
      <button
        onClick={() => navigate(ROUTES.camera)}
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
      >
        <img src="/camera_btn.png" alt="사진 촬영" className="h-[52px] w-[52px]" />
      </button>
    </div>
  );
}
