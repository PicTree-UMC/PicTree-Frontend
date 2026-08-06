import { useState } from 'react';
import { Sheet } from '@/shared/components';
import { useKakaoMap } from '@/features/home/hooks/useKakaoMap';
import type { GeoCoords } from '@/shared/hooks/useGeolocation';

interface LocationPickerSheetProps {
  /** 지도를 열 때의 중심. 없으면 useKakaoMap 기본값(서울시청)에서 연다. */
  initialCoords: GeoCoords | null;
  onClose: () => void;
  onConfirm: (coords: GeoCoords) => void;
}

/**
 * 등록할 위치를 지도에서 직접 고르는 바텀시트.
 * 지하처럼 측위가 부정확한 곳에서 GPS 좌표 대신 쓴다.
 *
 * 핀은 지도 위에 얹은 마커가 아니라 **화면 정중앙에 고정된 그림**이다. 지도를 끌면
 * 핀은 가만히 있고 지도가 움직이므로, 확정 시점의 지도 중심이 곧 핀이 가리키는 곳이다.
 * 마커 객체도 드래그 이벤트도 필요 없고, 손가락이 핀을 가리지도 않는다.
 */
export function LocationPickerSheet({
  initialCoords,
  onClose,
  onConfirm,
}: LocationPickerSheetProps) {
  /*
   * 중심은 열 때 한 번만 정한다. useKakaoMap 은 center 가 바뀌면 지도를 새로 만드는데,
   * 그러면 사용자가 맞춰 둔 화면이 통째로 날아간다.
   */
  const [initialCenter] = useState(() =>
    initialCoords ? { lat: initialCoords.latitude, lng: initialCoords.longitude } : undefined,
  );
  const { containerRef, map } = useKakaoMap(initialCenter, 3);

  const handleConfirm = () => {
    if (!map) return;
    const center = map.getCenter();
    // accuracy 를 붙이지 않는다 — 사용자가 찍은 좌표에는 신뢰반경이라는 개념이 없다.
    onConfirm({ latitude: center.getLat(), longitude: center.getLng() });
  };

  return (
    /* 본문이 지도라 손잡이를 두지 않는다 — 지도를 끌다 시트가 닫히면 곤란하다. 닫기는 '취소'. */
    <Sheet
      onClose={onClose}
      label="위치 직접 지정"
      handle={false}
      animateIn={false}
      className="rounded-t-[24px] bg-[#fffcef]"
      contentClassName="px-4 pt-5"
    >
      <h2 className="text-[15px] font-medium tracking-wide text-[#2c3930]">위치 직접 지정</h2>
      <p className="mt-1 text-[13px] text-[#5c6f2b]">지도를 움직여 핀을 실제 위치에 맞춰 주세요.</p>

      <div className="relative mt-3 h-[260px] w-full overflow-hidden rounded-[16px]">
        <div ref={containerRef} className="h-full w-full" />

        {/* 지도 정중앙 고정 핀. 지도와 연결되어 있지 않으므로 클릭도 가로채지 않는다.
              z-10 이 없으면 카카오맵이 타일에 매기는 z-index 에 가려 보이지 않는다. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-9 w-9 drop-shadow"
            fill="#5c6f2b"
          >
            <path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6.5a2.5 2.5 0 010 5z" />
          </svg>
        </div>
        {/* 핀 끝이 가리키는 지점 표시 — 핀 그림만으로는 어디를 찍는지 애매하다. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5c6f2b]/60" />
      </div>

      <div className="mt-4 flex justify-center gap-6">
        <button
          onClick={onClose}
          className="h-[38px] w-[92px] rounded-[12px] bg-[#d9d9d9] text-[15px] font-medium tracking-wide text-[#2c3930]"
        >
          취소
        </button>
        <button
          onClick={handleConfirm}
          disabled={!map}
          className={`h-[38px] w-[110px] rounded-[12px] bg-pictree-300 text-[15px] font-medium tracking-wide text-[#2c3930] transition-opacity ${
            map ? '' : 'opacity-50'
          }`}
        >
          여기로 지정
        </button>
      </div>
    </Sheet>
  );
}
