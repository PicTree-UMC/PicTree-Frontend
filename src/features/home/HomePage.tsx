import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useGeolocation } from '@/shared/hooks/useGeolocation';
import { useKakaoMap } from './hooks/useKakaoMap';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { useMapMarkers, type MapMarkerData } from './hooks/useMapMarkers';
import { useDeleteTree, useToggleFavorite, useTreeDetail, useTrees } from './hooks/useTrees';
import { JourneyBanner } from './components/JourneyBanner';
import { MarkerDetailSheet } from './components/MarkerDetailSheet';

/** 위치 권한 거부·미지원 시 지도가 열릴 기본 위치(서울시청). */
const FALLBACK_CENTER = { lat: 37.5665, lng: 126.978 };

export function HomePage() {
  const navigate = useNavigate();
  const { coords, loading: locating } = useGeolocation();

  // 현재 위치가 확인될 때까지 지도 생성을 미루고, 확인되면 그 위치에서 연다.
  // 권한 거부·미지원이면 서울시청으로 폴백한다.
  const initialCenter = useMemo(() => {
    if (locating) return null;
    if (coords) return { lat: coords.latitude, lng: coords.longitude };
    return FALLBACK_CENTER;
  }, [locating, coords]);

  const { containerRef, map } = useKakaoMap(initialCenter, 3);
  useCurrentLocation(map, coords);

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

      {/* 현재 위치 확인/지도 준비 중 로딩 */}
      {!map && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-50">
          <p className="text-sm text-neutral-400">현재 위치를 불러오는 중…</p>
        </div>
      )}

      {/* 동선 추가 알림 카드 */}
      <JourneyBanner placeCount={0} />

      {/*
        카메라 버튼 — 탭바(86px)가 지도 위에 얹히므로 그보다 위에 띄운다.
        예전에는 탭바가 지도 아래에 흐름상 놓여 bottom-6 으로 충분했다.
      */}
      <button
        onClick={() => navigate(ROUTES.camera)}
        className="absolute bottom-[110px] left-1/2 z-20 -translate-x-1/2"
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
