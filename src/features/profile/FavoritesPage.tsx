import { useState } from "react";
import chevronLeftIcon from "./assets/icons/chevronLeft.svg";
import chevronIcon from "./assets/icons/chevron.svg";
import starBadgeIcon from "./assets/icons/starBadge.svg";
import treeIcon from "./assets/icons/tree.svg";
import trashIcon from "./assets/icons/trash.svg";
import trashLargeIcon from "./assets/icons/trashLarge.svg";

interface FavoritePlace {
  id: string;
  name: string;
  description: string;
  savedAt: string; 
  thumbnailUrl?: string; 
}

const MOCK_FAVORITES: FavoritePlace[] = [
  {
    id: "1",
    name: "오아시스 만난 곳",
    description: "길 가다가 오아시스 자만추",
    savedAt: "2026-03-30",
  },
  {
    id: "2",
    name: "마트",
    description: "물사러 갔는데 마트에 공짜 정수기가 있었따",
    savedAt: "2026-03-30",
  },
];

type SortOrder = "latest" | "registered";
const SORT_LABELS: Record<SortOrder, string> = {
  latest: "최신순",
  registered: "등록순",
};

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoritePlace[]>(MOCK_FAVORITES);
  const [target, setTarget] = useState<FavoritePlace | null>(null); // 제거 대상
  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [sortOpen, setSortOpen] = useState(false);

  // 최신순 = 저장일 내림차순, 등록순 = 저장일 오름차순(먼저 등록된 순)
  const sortedFavorites = [...favorites].sort((a, b) => {
    const cmp = a.savedAt.localeCompare(b.savedAt) || a.id.localeCompare(b.id);
    return sortOrder === "latest" ? -cmp : cmp;
  });

  const handleRemove = () => {
    if (!target) return;
    setFavorites((prev) => prev.filter((place) => place.id !== target.id));
    setTarget(null);
  };

  return (
    <div className="relative flex min-h-full flex-col bg-[#FFFDF7] pb-28">
      {/* 헤더 밴드 */}
      <header className="bg-[#C5D89D] px-5 pb-8 pt-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="뒤로 가기"
            className="flex h-6 w-6 items-center justify-center"
          >
            <img src={chevronLeftIcon} alt="" className="h-[21px] w-[12px]" />
          </button>
          <h1 className="text-xl font-bold text-black">즐겨찾기 장소</h1>
        </div>
        <p className="mt-4 text-sm text-[#2C3930]">
          다시 방문하고 싶은 장소를 관리해보세요
        </p>
      </header>

      <div className="flex flex-col gap-4 px-5 pt-5">
        {/* 요약 카드 */}
        <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]">
          <img src={starBadgeIcon} alt="" className="h-12 w-12 flex-shrink-0" />
          <span className="text-lg font-bold text-black">
            즐겨찾기 {favorites.length}곳
          </span>
        </div>

        {/* 안내 배너 */}
        <div className="flex items-center gap-2 rounded-xl bg-[#ECF6D8] px-4 py-3">
          <img src={treeIcon} alt="" className="h-5 w-5 flex-shrink-0" />
          <p className="text-xs text-[#2C3930]">
            지도에서 나무를 탭하면 바로 즐겨찾기를 추가할 수 있어요!
          </p>
        </div>

        {/* 저장한 장소 + 정렬 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-black">저장한 장소</h2>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((prev) => !prev)}
              aria-expanded={sortOpen}
              className="inline-flex items-center gap-1.5 rounded-[20px] py-1.5 pl-4 pr-2 text-sm text-[#303030]"
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
                      className={`block w-full px-4 py-2.5 text-left text-sm ${
                        opt === sortOrder
                          ? "bg-[#ECF6D8] font-bold text-[#2C3930]"
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
        {favorites.length === 0 ? (
          <p className="py-10 text-center text-sm text-[#90908F]">
            즐겨찾기한 장소가 없어요.
          </p>
        ) : (
          sortedFavorites.map((place) => (
            <div
              key={place.id}
              className="relative flex items-start gap-3 rounded-2xl bg-white p-3 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)]"
            >
              {/* 썸네일 (백엔드 연동 시 이미지로 교체) */}
              {place.thumbnailUrl ? (
                <img
                  src={place.thumbnailUrl}
                  alt=""
                  className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="h-16 w-16 flex-shrink-0 rounded-xl bg-[#D9D9D9]" />
              )}

              <div className="min-w-0 flex-1 pr-7">
                <p className="text-base font-bold text-black">{place.name}</p>
                <p className="mt-0.5 text-xs text-[#90908F]">
                  {place.description}
                </p>
                <p className="mt-1 text-xs text-[#90908F]">{place.savedAt}</p>
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
            <p className="mt-3 text-lg font-bold text-black">
              즐겨찾기에서 제거할까요?
            </p>
            <p className="mt-1 text-xs text-[#303030]">{target.name}</p>

            <div className="mt-5 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="h-9 w-[86px] rounded-xl bg-[#E6E6E6] text-sm font-semibold text-[#303030]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="h-9 w-[86px] rounded-xl bg-[#FF5858] text-sm font-semibold text-white"
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
