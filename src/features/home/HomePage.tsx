import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useKakaoMap } from './hooks/useKakaoMap';
import { useMapMarkers, type MapMarkerData } from './hooks/useMapMarkers';
import { useDeleteTree, useToggleFavorite, useTreeDetail, useTrees } from './hooks/useTrees';
import { JourneyBanner } from './components/JourneyBanner';
import { MarkerDetailSheet } from './components/MarkerDetailSheet';

export function HomePage() {
  const navigate = useNavigate();
  const { containerRef, map } = useKakaoMap(37.5665, 126.978, 3);

  const { data: markers = [] } = useTrees();
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const toggleFavorite = useToggleFavorite();
  const deleteTree = useDeleteTree();
  const { data: selectedDetail } = useTreeDetail(selectedMarkerId);

  const handleMarkerClick = useCallback((marker: MapMarkerData) => {
    setSelectedMarkerId(marker.id);
  }, []);

  useMapMarkers(map, markers, handleMarkerClick);

  /**
   * 상세시트에 넘길 데이터. 목록 마커(즐겨찾기·이름 등)를 기본으로 쓰되,
   * 코멘트·사진·날짜는 상세 조회 결과로 채운다(로그인 시).
   */
  const selectedMarker = useMemo<MapMarkerData | null>(() => {
    const listMarker = markers.find((marker) => marker.id === selectedMarkerId);
    if (!listMarker) return null;
    return {
      ...listMarker,
      comment: selectedDetail?.comment ?? listMarker.comment,
      photo: selectedDetail?.photo ?? listMarker.photo,
      date: selectedDetail?.date || listMarker.date,
    };
  }, [markers, selectedMarkerId, selectedDetail]);

  const handleToggleFavorite = () => {
    if (!selectedMarkerId) return;
    toggleFavorite.mutate(selectedMarkerId);
  };

  const handleEdit = () => {
    // TODO: 장소 정보 수정 화면/폼 연동
  };

  const handleDelete = () => {
    if (!selectedMarkerId) return;
    deleteTree.mutate(selectedMarkerId);
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
