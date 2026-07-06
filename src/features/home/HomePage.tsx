import { BottomTabBar } from '@/shared/components';
import { useKakaoMap } from './hooks/useKakaoMap';
import { useMapMarkers } from './hooks/useMapMarkers';
import { JourneyBanner } from './components/JourneyBanner';
import { DEMO_MARKERS } from './mocks/markers';

export function HomePage() {
  const { containerRef, map } = useKakaoMap(37.5665, 126.978, 3);
  useMapMarkers(map, DEMO_MARKERS);

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 카카오맵 */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* 동선 추가 알림 카드 */}
      <JourneyBanner placeCount={0} />

      {/* 카메라 버튼 */}
      <button className="absolute bottom-[90px] left-1/2 z-20 flex h-[52px] w-[52px] -translate-x-1/2 items-center justify-center rounded-full bg-pictree-700 shadow-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* 하단 탭바 */}
      <BottomTabBar />
    </div>
  );
}
