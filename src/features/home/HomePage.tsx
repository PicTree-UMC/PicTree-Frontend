import { useCallback, useMemo, useState } from 'react';
import { useGeolocation } from '@/shared/hooks/useGeolocation';
import { useKakaoMap } from './hooks/useKakaoMap';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { useMapMarkers, type MapMarkerData } from './hooks/useMapMarkers';
import { useDeleteTree, useToggleFavorite, useTreeDetail, useTrees } from './hooks/useTrees';
import { JourneyBanner } from './components/JourneyBanner';
import { MarkerStoryViewer } from './components/MarkerStoryViewer';

/** 위치 권한 거부·미지원 시 지도가 열릴 기본 위치(서울시청). */
const FALLBACK_CENTER = { lat: 37.5665, lng: 126.978 };

export function HomePage() {
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
  // 탭한 마커/클러스터에 묶인 나무들의 id 목록과, 지금 보고 있는 슬라이드 위치.
  // 단일 마커는 길이 1, 클러스터는 묶인 개수만큼 담겨 좌우로 넘겨 본다.
  const [selection, setSelection] = useState<{ ids: string[]; index: number } | null>(null);

  const toggleFavorite = useToggleFavorite();
  const deleteTree = useDeleteTree();

  // 지금 보고 있는 슬라이드의 나무만 상세 조회로 보강한다(넘길 때마다 그 나무를 조회).
  const activeId = selection ? selection.ids[selection.index] : null;
  const { data: selectedDetail } = useTreeDetail(activeId);

  const handleSelect = useCallback((group: MapMarkerData[]) => {
    setSelection({ ids: group.map((marker) => marker.id), index: 0 });
  }, []);

  // 마커 등장 애니메이션의 기준점 = 사용자 위치(없으면 지도 중심으로 폴백).
  const markerOrigin = useMemo(
    () => (coords ? { lat: coords.latitude, lng: coords.longitude } : null),
    [coords],
  );

  useMapMarkers(map, markers, handleSelect, markerOrigin);

  /**
   * 상세 뷰어에 넘길 마커 배열. 목록 마커(즐겨찾기·이름 등)를 기본으로 쓰되,
   * 지금 보고 있는 나무만 코멘트·사진·날짜를 상세 조회 결과로 채운다(로그인 시).
   */
  const selectedMarkers = useMemo<MapMarkerData[] | null>(() => {
    if (!selection) return null;
    const resolved = selection.ids
      .map((id) => markers.find((marker) => marker.id === id))
      .filter((marker): marker is MapMarkerData => Boolean(marker));
    if (resolved.length === 0) return null;
    return resolved.map((marker) =>
      marker.id === activeId
        ? {
            ...marker,
            comment: selectedDetail?.comment ?? marker.comment,
            photo: selectedDetail?.photo ?? marker.photo,
            date: selectedDetail?.date || marker.date,
          }
        : marker,
    );
  }, [markers, selection, activeId, selectedDetail]);

  const handleNavigate = useCallback((index: number) => {
    setSelection((prev) => (prev ? { ...prev, index } : prev));
  }, []);

  const handleToggleFavorite = () => {
    if (!activeId) return;
    toggleFavorite.mutate(activeId);
  };

  const handleEdit = () => {
    // TODO: 장소 정보 수정 화면/폼 연동
  };

  const handleDelete = () => {
    if (!activeId) return;
    deleteTree.mutate(activeId);
    // 삭제한 나무를 그룹에서 빼고, 남은 게 있으면 위치를 안전하게 당겨 유지한다.
    setSelection((prev) => {
      if (!prev) return prev;
      const ids = prev.ids.filter((id) => id !== activeId);
      if (ids.length === 0) return null;
      return { ids, index: Math.min(prev.index, ids.length - 1) };
    });
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/*
        카카오맵 — 노치(safe-area)까지 덮는 fixed 풀블리드.
        앱 컬럼(h-dvh)은 상단 safe-area 아래에서 시작하므로, absolute inset-0 으로는
        지도가 컬럼 안에만 그려져 노치 영역이 크림 base 로 비어 '잘려 보인다'.
        MarkerStoryViewer 와 같은 fixed 풀블리드 방식으로 visual viewport 를 덮어 해결한다.
        (mx-auto sm:max-w-[390px]: 데스크톱에서 앱 컬럼 폭에 맞춘다.)
      */}
      <div ref={containerRef} className="fixed inset-0 z-0 mx-auto sm:max-w-[390px]" />

      {/* 현재 위치 확인/지도 준비 중 로딩 — 지도와 같은 영역(노치 포함)을 덮는다 */}
      {!map && (
        <div className="fixed inset-0 z-10 mx-auto flex items-center justify-center bg-neutral-50 sm:max-w-[390px]">
          <p className="text-sm text-neutral-400">현재 위치를 불러오는 중…</p>
        </div>
      )}

      {/* 상단 안내 카드 — 기록한 장소 수 표시 + 장소 기록하기(카메라) 버튼 */}
      <JourneyBanner placeCount={markers.length} />

      {/* 마커 상세 — 인스타 스토리형 풀스크린 뷰어. 클러스터는 좌우로 넘겨 본다. */}
      {selectedMarkers && selection && (
        <MarkerStoryViewer
          markers={selectedMarkers}
          activeIndex={Math.min(selection.index, selectedMarkers.length - 1)}
          onNavigate={handleNavigate}
          onClose={() => setSelection(null)}
          onToggleFavorite={handleToggleFavorite}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
