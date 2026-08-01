import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const { coords, loading: locating, request: refreshLocation } = useGeolocation();

  // 지도의 최초 중심은 "처음 위치가 확인되는 순간" 딱 한 번만 정하고 그 뒤로 고정한다.
  // 이렇게 두지 않으면, 나중에 위치 새로고침으로 locating 이 다시 true 가 될 때 중심이 null 로
  // 돌아가 지도가 파괴·재생성되며 화면이 깜빡인다. 이동은 아래 panTo(부드러운 따라가기)에 맡긴다.
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (initialCenter || locating) return; // 이미 정했거나 최초 확인 중이면 대기
    // 권한 거부·미지원이면 서울시청으로 폴백한다.
    setInitialCenter(
      coords ? { lat: coords.latitude, lng: coords.longitude } : FALLBACK_CENTER,
    );
  }, [locating, coords, initialCenter]);

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

  // 우하단 버튼 — 누르면 GPS 를 새로 읽고(refreshLocation), 갱신된 좌표가 도착하면
  // 그 위치로 지도를 옮긴다. 좌표 갱신은 비동기라 ref 플래그를 세워 두고 아래 effect 에서 처리한다.
  const recenterPendingRef = useRef(false);
  const handleRecenter = () => {
    recenterPendingRef.current = true;
    refreshLocation();
  };

  useEffect(() => {
    if (!recenterPendingRef.current || !map || !coords) return;
    map.panTo(new window.kakao.maps.LatLng(coords.latitude, coords.longitude));
    recenterPendingRef.current = false;
  }, [map, coords]);

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

      {/*
        현재 위치 새로고침 — 우하단 플로팅 버튼. 탭바 위에 띄운다(bottom-nav).
        지도가 준비됐을 때만 노출하고, 탭하면 GPS 를 새로 읽어 그 위치로 이동한다.
        읽는 동안엔 아이콘을 회전시키고 중복 탭을 막는다.
      */}
      {map && (
        <button
          onClick={handleRecenter}
          disabled={locating}
          aria-label="현재 위치 새로고침"
          /* 흰 배경 + GREEN-500(#788F4A) 아이콘 — 흰 위 3.6:1 로 그래픽 요소(3:1) 충족. */
          className="bottom-nav absolute right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#788F4A] shadow-lg ring-1 ring-black/5 transition active:scale-95 disabled:opacity-70"
        >
          <MyLocationIcon spinning={locating} />
        </button>
      )}

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

/** 내 위치로 이동 아이콘 — 중심 점 + 십자선이 있는 조준(locate) 형태. 새로고침 중엔 회전. */
function MyLocationIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`h-5 w-5 ${spinning ? 'animate-spin' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
    >
      <circle cx="12" cy="12" r="3.25" />
      <path strokeLinecap="round" d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </svg>
  );
}
