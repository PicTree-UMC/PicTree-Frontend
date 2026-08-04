import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useGeolocation } from '@/shared/hooks/useGeolocation';
import { useKakaoMap } from './hooks/useKakaoMap';
import { useCurrentLocation } from './hooks/useCurrentLocation';
import { useMapMarkers, type MapMarkerData } from './hooks/useMapMarkers';
import { useDeleteTree, useToggleFavorite, useTreeDetail, useTrees } from './hooks/useTrees';
import { JourneyBanner } from './components/JourneyBanner';
import { NearbyTreeAlert } from '@/features/profile/components';
import { useNearbyAlertWatcher } from '@/features/profile/hooks/useNearbyAlertWatcher';
import { MarkerStoryViewer } from './components/MarkerStoryViewer';

/** 위치 권한 거부·미지원 시 지도가 열릴 기본 위치(서울시청). */
const FALLBACK_CENTER = { lat: 37.5665, lng: 126.978 };

export function HomePage() {
  const navigate = useNavigate();
  // 지도는 이동을 따라가야 하므로 추적 모드로 받는다. request(refreshLocation)는
  // 추적 중에도 수동 재조회로 쓸 수 있어 우하단 새로고침 버튼에서 사용한다.
  const { coords, loading: locating, request: refreshLocation } = useGeolocation({ watch: true });

  /*
   * 근처 나무 알림. 위치가 의미 있게 바뀌면 서버에 확인을 요청하고(푸시는 서버가 쏜다),
   * 반경 50m 안에 내 나무가 있으면 지도 위에도 카드로 알린다.
   *
   * ⚠️ 앱이 켜져 있을 때만 동작한다 — 웹은 앱이 꺼진 상태에서 위치를 추적할 수 없다.
   * 지도가 위치를 계속 받는 유일한 화면이라 여기에 둔다.
   */
  const nearbyAlert = useNearbyAlertWatcher(coords);

  /*
   * 현재 위치가 확인될 때까지 지도 생성을 미루고, 확인되면 그 위치에서 연다.
   * 권한 거부·미지원이면 서울시청으로 폴백한다.
   *
   * ⚠️ 한 번 정해지면 다시 바꾸지 않는다. useKakaoMap 은 중심 좌표가 바뀌면 지도를
   * 새로 만드는데, 추적 모드에서는 좌표가 계속 들어오므로 그때마다 지도가 다시 그려져
   * 사용자가 움직여 둔 화면과 마커가 통째로 날아간다. 이후 좌표는 내 위치 점만 옮긴다.
   */
  const [initialCenter, setInitialCenter] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (initialCenter || locating) return;
    setInitialCenter(coords ? { lat: coords.latitude, lng: coords.longitude } : FALLBACK_CENTER);
  }, [initialCenter, locating, coords]);

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
        카카오맵 — 노치(safe-area)까지 덮는 풀블리드.
        `fixed inset-0` 으로는 노치가 안 채워진다. iOS 홈화면 PWA 는 레이아웃 뷰포트가
        상태바 아래에서 시작해서 fixed top:0 도 노치 밑에 놓이기 때문이다(#97).
        음수 top 으로 뷰포트 밖까지 끌어올리는 `.fullbleed` 를 쓴다 — 이유는 styles.css 주석.
        (mx-auto sm:max-w-[390px]: 데스크톱에서 앱 컬럼 폭에 맞춘다.)
      */}
      <div ref={containerRef} className="fullbleed z-0 mx-auto sm:max-w-[390px]" />

      {/* 현재 위치 확인/지도 준비 중 로딩 — 지도와 같은 영역(노치 포함)을 덮는다 */}
      {!map && (
        <div className="fullbleed z-10 mx-auto flex items-center justify-center bg-neutral-50 sm:max-w-[390px]">
          <p className="text-sm text-neutral-400">현재 위치를 불러오는 중…</p>
        </div>
      )}

      {/* 상단 안내 카드 — 기록한 장소 수만 보여준다 */}
      <JourneyBanner placeCount={markers.length} />

      {/*
        근처 나무 알림 — 시안대로 발자국 배너 바로 아래에 얹는다.
        여러 곳이 반경 안에 들어와도 카드는 하나다(가장 가까운 곳 + "외 N곳").
        지도를 가리지 않도록 카드 밖은 터치가 통과하게 둔다.
      */}
      {nearbyAlert && (
        <div className="pointer-events-none absolute inset-x-4 top-[92px] z-30 flex justify-center [&_button]:pointer-events-auto">
          <NearbyTreeAlert
            placeName={nearbyAlert.label}
            distanceM={Math.round(nearbyAlert.distanceM)}
            onView={() =>
              setSelection({ ids: nearbyAlert.trees.map((t) => String(t.treeId)), index: 0 })
            }
          />
        </div>
      )}

      {/*
        장소 기록(카메라) — 하단 중앙 플로팅 버튼. 탭바가 지도 위에 얹히므로
        그보다 위에 띄운다(bottom-nav = 탭바 높이 + 하단 안전영역). 고정 px 로 두면
        노치 기기에서 탭바가 안전영역만큼 높아져 버튼이 가려진다.
        left-1/2 + -translate-x-1/2 로 화면 가로 중앙에 정렬한다.
        흰 배경 + GREEN-500(#788F4A) 아이콘 — 흰 위 3.6:1 로 그래픽 요소(3:1) 충족.
      */}
      <button
        onClick={() => navigate(ROUTES.camera)}
        aria-label="장소 기록하기"
        className="bottom-nav absolute left-1/2 z-20 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-white text-[#788F4A] shadow-lg ring-1 ring-black/5 transition active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
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

      {/*
        현재 위치 새로고침 — 우측 상단 플로팅 버튼. 상단 안내 카드(top-4, 높이 약 60px)
        바로 아래(top-20)에 두어 배너와 겹치지 않게 한다. 지도가 준비됐을 때만 노출하고,
        탭하면 GPS 를 새로 읽어 그 위치로 이동한다. 읽는 동안엔 아이콘을 회전시키고 중복 탭을 막는다.
      */}
      {map && (
        <button
          onClick={handleRecenter}
          disabled={locating}
          aria-label="현재 위치 새로고침"
          /* 흰 배경 + GREEN-500(#788F4A) 아이콘 — 흰 위 3.6:1 로 그래픽 요소(3:1) 충족. */
          className="absolute right-4 top-24 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#788F4A] shadow-lg ring-1 ring-black/5 transition active:scale-95 disabled:opacity-70"
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
