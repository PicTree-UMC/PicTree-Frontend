import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useKakaoMap } from './hooks/useKakaoMap';
import { useMapMarkers, type MapMarkerData } from './hooks/useMapMarkers';
import { JourneyBanner } from './components/JourneyBanner';
import { MarkerDetailSheet } from './components/MarkerDetailSheet';
import { DEMO_MARKERS } from './mocks/markers';

export function HomePage() {
  const navigate = useNavigate();
  const { containerRef, map } = useKakaoMap(37.5665, 126.978, 3);
  const [markers, setMarkers] = useState(DEMO_MARKERS);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const handleMarkerClick = useCallback((marker: MapMarkerData) => {
    setSelectedMarkerId(marker.id);
  }, []);

  useMapMarkers(map, markers, handleMarkerClick);

  const selectedMarker = markers.find((marker) => marker.id === selectedMarkerId) ?? null;

  const handleToggleFavorite = () => {
    if (!selectedMarkerId) return;
    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === selectedMarkerId ? { ...marker, isFavorite: !marker.isFavorite } : marker,
      ),
    );
  };

  const handleEdit = () => {
    // TODO: 장소 정보 수정 화면/폼 연동
  };

  const handleDelete = () => {
    if (!selectedMarkerId) return;
    setMarkers((prev) => prev.filter((marker) => marker.id !== selectedMarkerId));
    setSelectedMarkerId(null);
  };

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

      {/* 마커 상세 바텀시트 */}
      {selectedMarker && (
        <MarkerDetailSheet
          marker={selectedMarker}
          onClose={() => setSelectedMarkerId(null)}
          onToggleFavorite={handleToggleFavorite}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
