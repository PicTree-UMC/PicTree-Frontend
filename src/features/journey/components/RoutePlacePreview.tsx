import { useState, type CSSProperties } from 'react';
import { Sheet } from '@/shared/components';
import { RoutePlace } from '../types/route';
import { formatDateLabel } from '../lib/formatDate';

/** 사진을 안 올린 장소. 홈 마커·스토리 뷰어와 같은 기본 아이콘을 쓴다. */
const FALLBACK_ICON = '/markers/tree.svg';

/**
 * 줄에 늘어놓는 최대 개수. 한 번에 최대 20곳까지 딸려 올 수 있는데, 전부 그리면 가로 스크롤이
 * 길어지기만 하고 훑어봐도 뭐가 뭔지 모른다. 몇 개만 보여 '이런 곳들' 이라는 감만 주고,
 * 다 보고 싶으면 시트에서 이름과 함께 본다.
 */
const PREVIEW_LIMIT = 3;

function PlaceAvatar({
  place,
  className = '',
  style,
}: {
  place: RoutePlace;
  className?: string;
  style?: CSSProperties;
}) {
  const base = `h-11 w-11 shrink-0 rounded-full border border-pictree-300 ${className}`;

  return place.imageUrl ? (
    <img src={place.imageUrl} alt={place.name} style={style} className={`${base} object-cover`} />
  ) : (
    <span
      role="img"
      aria-label={place.name}
      style={style}
      className={`${base} flex items-center justify-center bg-white`}
    >
      <img src={FALLBACK_ICON} alt="" className="h-6 w-6" />
    </span>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

interface RoutePlacePreviewProps {
  /** 고른 날짜의 장소들. 방문 순서대로 온다 — 그대로 그리면 동선 순서가 된다. */
  places: RoutePlace[];
  /** 고른 날짜를 전부 해제한다. 해제할 게 없으면(=장소가 없으면) 버튼이 사라진다. */
  onClear: () => void;
}

/**
 * 고른 날짜에 딸려 오는 장소들을 원형 사진 몇 개로 보여준다.
 *
 * **달력 칸에 있던 `n곳` 을 대신한다.** 칸 안의 숫자는 자리를 많이 먹으면서도 '몇 곳'
 * 이상은 알려주지 못했다. 어차피 다음 화면에서 장소를 하나씩 끄고 켤 거라, 고르는 단계에서
 * 궁금한 건 개수보다 **어디를 이었는지**다.
 *
 * 줄에는 이름을 붙이지 않는다 — 원 하나가 44px 이라 '스타벅스 강남…' 처럼 잘려서 오히려 못
 * 읽는다. 이름이 필요한 자리는 `더 보기` 시트고, 낭독기에는 줄에서도 이름을 그대로 넘긴다.
 */
export function RoutePlacePreview({ places, onClear }: RoutePlacePreviewProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <section>
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate text-[13px] text-[#60655c]">
          {places.length === 0
            ? '날짜를 고르면 그날의 장소가 여기에 보여요'
            : `장소 ${places.length}곳`}
        </h2>

        {/* 해제할 게 없으면 숨긴다 — 눌러도 아무 일이 없는 버튼이 계속 떠 있을 이유가 없다. */}
        {places.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-[13px] font-medium text-[#60655c] underline underline-offset-2"
          >
            전체 해제
          </button>
        )}
      </div>

      {places.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          {/* 순서대로 톡톡 떠오른다. 간격(70ms)은 길이(420ms)보다 훨씬 짧아 겹치게 두는데,
              셋뿐이라 '하나 끝나고 다음' 으로 하면 마지막이 늦어 굼떠 보인다.
              ⚠️ 지연은 인라인이어야 한다 — Tailwind `animation` 단축 속성이 `[animation-delay]`
              유틸을 덮어쓴다(JourneyRoadmap 과 같은 이유). */}
          {places.slice(0, PREVIEW_LIMIT).map((place, index) => (
            <PlaceAvatar
              key={place.id}
              place={place}
              className="animate-roadmap-pop"
              style={{ animationDelay: `${index * 70}ms` }}
            />
          ))}

          {places.length > PREVIEW_LIMIT && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="ml-auto flex shrink-0 items-center gap-0.5 py-2 text-[13px] font-medium text-pictree-700"
            >
              더 보기 {places.length - PREVIEW_LIMIT}곳
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {showAll && (
        <Sheet
          onClose={() => setShowAll(false)}
          label="선택한 장소"
          className="max-h-[70vh] rounded-t-[24px] bg-[#FFFCEF]"
          contentClassName="overflow-y-auto px-5"
        >
          <h3 className="pb-3 text-[15px] font-medium text-[#2c3930]">
            선택한 장소 {places.length}곳
          </h3>

          <ul className="flex flex-col gap-3">
            {/* 순번은 붙이지 않는다 — 이 순서는 아직 확정이 아니다. 다음 화면에서 장소를 끄면
                번호가 당겨지므로, 여기서 미리 번호를 보이면 그때 서로 어긋난다.
                목록 순서 자체가 방문 순서라 위아래로도 읽힌다. */}
            {places.map((place) => (
              <li key={place.id} className="flex items-center gap-3">
                <PlaceAvatar place={place} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-[#2c3930]">{place.name}</p>
                  <p className="mt-0.5 text-[13px] text-[#60655c]">{formatDateLabel(place.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Sheet>
      )}
    </section>
  );
}
