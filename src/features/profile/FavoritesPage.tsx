import { useState } from "react";
import { useFavorites, useRemoveFavorite } from "./hooks/useFavorites";
import type { FavoritePlace } from "./types/favorite";
import { NavBar } from "@/shared/components";
import chevronIcon from "./assets/icons/chevron.svg";
import starBadgeIcon from "./assets/icons/starBadge.svg";
import treeIcon from "./assets/icons/tree.svg";
import trashIcon from "./assets/icons/trash.svg";
import trashLargeIcon from "./assets/icons/trashLarge.svg";

type SortOrder = "latest" | "registered";
const SORT_LABELS: Record<SortOrder, string> = {
  latest: "최신순",
  registered: "등록순",
};

export function FavoritesPage() {
  const { data, isPending, isError, refetch } = useFavorites();
  const { mutate: removeFavorite } = useRemoveFavorite();

  const [target, setTarget] = useState<FavoritePlace | null>(null); // 제거 대상
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [sortOpen, setSortOpen] = useState(false);

  const favorites = data?.favorites ?? [];
  // 개수는 서버가 준 값을 쓴다 (목록 길이와 같지만 응답에 명시돼 있다)
  const count = data?.count ?? 0;

  /**
   * 최신순 = 기록일 내림차순, 등록순 = 기록일 오름차순(먼저 기록한 순).
   *
   * ⚠️ 즐겨찾기에 담은 시각은 응답에 없다. 장소를 기록한 날(`createdAt`)이
   * 유일한 날짜라 그걸로 정렬한다. 같은 날이면 treeId 로 갈라 순서가 흔들리지
   * 않게 한다. 날짜가 비어 오더라도 정렬이 터지지 않게 빈 문자열로 받는다 —
   * 목록 하나가 이상하다고 화면 전체가 죽으면 안 된다.
   */
  const sortedFavorites = [...favorites].sort((a, b) => {
    const cmp =
      (a.createdAt ?? "").localeCompare(b.createdAt ?? "") || a.treeId - b.treeId;
    return sortOrder === "latest" ? -cmp : cmp;
  });

  const handleRemove = () => {
    if (!target) return;
    removeFavorite(target.treeId);
    setTarget(null);
  };

  return (
    <div className="relative flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      <header className="bg-[#C5D89D] px-5 pb-8 pt-header">
        <NavBar onBack={() => window.history.back()} title="즐겨찾기 장소" />
        <p className="mt-4 text-[14px] text-[#2C3930]">
          다시 방문하고 싶은 장소를 관리해보세요
        </p>
      </header>

      <div className="flex flex-col gap-4 px-5 pt-5">
        {/* 요약 카드 */}
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]">
          <img src={starBadgeIcon} alt="" className="h-12 w-12 flex-shrink-0" />
          <span className="text-[17px] font-medium text-black">
            즐겨찾기 {count}곳
          </span>
        </div>

        {/* 안내 배너 */}
        <div className="flex items-center gap-2 rounded-xl bg-[#ECF6D8] px-4 py-3">
          <img src={treeIcon} alt="" className="h-5 w-5 flex-shrink-0" />
          <p className="text-[13px] text-[#2C3930]">
            지도에서 나무를 탭하면 바로 즐겨찾기를 추가할 수 있어요!
          </p>
        </div>

        {/* 저장한 장소 + 정렬 */}
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-medium text-black">저장한 장소</h2>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((prev) => !prev)}
              aria-expanded={sortOpen}
              className="inline-flex items-center gap-1.5 rounded-[20px] py-1.5 pl-4 pr-2 text-[14px] text-[#303030]"
              style={{ background: "linear-gradient(180deg, #ECF6D8, #FFF6D1)" }}
            >
              {SORT_LABELS[sortOrder]}
              <img
                src={chevronIcon}
                alt=""
                className={`h-3 w-3 ${sortOpen ? "-rotate-90" : "rotate-90"}`}
              />
            </button>

            {sortOpen && (
              <>
                {/* 바깥 클릭 시 닫힘 */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSortOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-28 overflow-hidden rounded-xl bg-white shadow-[0px_4px_16px_0px_rgba(0,0,0,0.12)]">
                  {(["latest", "registered"] as SortOrder[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSortOrder(opt);
                        setSortOpen(false);
                      }}
                      className={`block w-full px-4 py-2.5 text-left text-[14px] ${
                        opt === sortOrder
                          ? "bg-[#ECF6D8] font-medium text-[#2C3930]"
                          : "text-[#303030]"
                      }`}
                    >
                      {SORT_LABELS[opt]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 장소 목록 */}
        {isPending ? (
          <p className="py-10 text-center text-[14px] text-[#90908F]">불러오는 중...</p>
        ) : isError ? (
          <div className="py-10 text-center">
            <p className="text-[14px] text-[#FF5858]">즐겨찾기를 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-[#89986D] px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-[#90908F]">
            즐겨찾기한 장소가 없어요.
          </p>
        ) : (
          sortedFavorites.map((place) => (
            <div
              key={place.treeId}
              className="relative flex items-start gap-3 rounded-2xl bg-white p-3 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]"
            >
              {/* 썸네일 — 사진이 없는 장소는 회색 자리로 둔다 */}
              {place.imageUrl ? (
                <img
                  src={place.imageUrl}
                  alt=""
                  className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="h-16 w-16 flex-shrink-0 rounded-xl bg-[#D9D9D9]" />
              )}

              <div className="min-w-0 flex-1 pr-7">
                <p className="text-[15px] font-medium text-black">{place.name}</p>
                {place.description && (
                  <p className="mt-0.5 text-[13px] text-[#90908F]">
                    {place.description}
                  </p>
                )}
                <p className="mt-1 text-[13px] text-[#90908F]">{place.createdAt}</p>
              </div>

              <button
                type="button"
                onClick={() => setTarget(place)}
                aria-label={`${place.name} 즐겨찾기에서 제거`}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#FFECEC]"
              >
                <img src={trashIcon} alt="" className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5"
          onClick={() => setTarget(null)}
        >
          <div
            className="w-full max-w-[302px] rounded-[20px] bg-[#FFFCEF] px-6 py-6 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={trashLargeIcon} alt="" className="mx-auto h-[34px] w-[30px]" />
            <p className="mt-3 text-[17px] font-medium text-black">
              즐겨찾기에서 제거할까요?
            </p>
            <p className="mt-1 text-[13px] text-[#303030]">{target.name}</p>

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="h-9 w-[86px] rounded-xl bg-[#E6E6E6] text-[14px] font-medium text-[#303030]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="h-9 w-[86px] rounded-xl bg-[#FF5858] text-[14px] font-medium text-white"
              >
                제거
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
