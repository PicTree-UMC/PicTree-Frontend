import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { useFavorites } from "../hooks/useFavorites";
import { PreviewCard } from "./PreviewCard";

/** 미리보기에 세우는 줄 수. 넷째 줄부터는 카드가 목록이 되어 '전체 보기' 가 무의미해진다. */
const PREVIEW_COUNT = 3;

/**
 * 메인 탭의 즐겨찾기 장소 미리보기 — **최근에 기록한 3곳**을 그룹 리스트 꼴로.
 *
 * 전체 화면(`FavoritesPage`)은 사진 격자인데 여기는 줄이다. 일부러 다르다 — 격자는
 * 담아 둔 것을 훑어 찾는 얼개라 칸이 많아야 성립하고, 세 칸짜리 격자는 그냥 사진 세 장이다.
 * 줄이면 좁은 자리에서도 **장소 이름**이 살아서 "무엇을 담아 뒀나" 가 읽힌다.
 *
 * ⚠️ **줄마다 갈 곳이 없다.** 나무 상세 라우트가 없어서(즐겨찾기 전체 화면도 같은 사정)
 * 줄을 각각 누르게 만들 수 없고, 그래서 카드 하나가 통째로 전체 화면으로 가는 문이다.
 *
 * 정렬은 전체 화면의 기본값(최신순 = 기록일 내림차순)과 같다. 다르면 미리보기 3곳이
 * 들어가서 본 목록 맨 위 3곳과 어긋난다.
 */
export function FavoritesPreview() {
  const navigate = useNavigate();
  const { data, isPending, isError } = useFavorites();

  const favorites = data?.favorites ?? [];

  /*
    ⚠️ 즐겨찾기에 담은 시각은 응답에 없다. 장소를 기록한 날(`createdAt`)이 유일한 날짜라
    그걸로 정렬한다. 같은 날이면 treeId 로 갈라 순서가 흔들리지 않게 한다 — `FavoritesPage`
    의 '최신순' 과 같은 규칙이고, 둘이 어긋나면 미리보기가 거짓말이 된다.
  */
  const latest = [...favorites]
    .sort(
      (a, b) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || b.treeId - a.treeId,
    )
    .slice(0, PREVIEW_COUNT);

  return (
    <PreviewCard
      title="즐겨찾기 장소"
      // 개수는 서버가 세어 준 값을 그대로 쓴다. 못 받았으면 아예 안 쓴다.
      meta={data ? `${data.count}곳` : undefined}
      ariaLabel="즐겨찾기 장소 전체 보기"
      onClick={() => navigate(ROUTES.favorites)}
    >
      {isError ? (
        <p className="py-4 text-center text-[13px] text-[#60655C]">
          즐겨찾기를 불러오지 못했어요. 눌러서 전체 화면에서 다시 시도해 보세요.
        </p>
      ) : isPending ? (
        // 줄 높이(44px 썸네일 + 위아래 여백)를 그대로 잡아 카드가 나중에 안 튀게 한다
        <div className="flex flex-col gap-3">
          {Array.from({ length: PREVIEW_COUNT }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="size-11 shrink-0 animate-pulse rounded-lg bg-[#ECECEC]" />
              <span className="h-4 w-32 animate-pulse rounded bg-[#ECECEC]" />
            </div>
          ))}
        </div>
      ) : latest.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-[#60655C]">
          아직 담아 둔 장소가 없어요
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {latest.map((place) => (
            <div key={place.treeId} className="flex items-center gap-3">
              {/* 사진이 없는 장소는 회색 자리로 둔다 — `DayTreeList` 와 같은 처리다. */}
              {place.imageUrl ? (
                <img
                  src={place.imageUrl}
                  alt=""
                  className="size-11 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="size-11 shrink-0 rounded-lg bg-[#D9D9D9]" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[#2C3930]">
                  {place.name}
                </p>
                {place.description && (
                  <p className="mt-0.5 truncate text-[13px] text-[#60655C]">
                    {place.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PreviewCard>
  );
}
