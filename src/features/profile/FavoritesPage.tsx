import { useState } from "react";

import { Chip, NavBar } from "@/shared/components";
import { useFavorites, useRemoveFavorites } from "./hooks/useFavorites";
import type { FavoritePlace } from "./types/favorite";
import { FavoriteGrid } from "./components/FavoriteGrid";
import { FavoritePostView } from "./components/FavoritePostView";
import trashLargeIcon from "./assets/icons/trashLarge.svg";

type SortOrder = "latest" | "registered";
const SORT_ORDERS: SortOrder[] = ["latest", "registered"];
const SORT_LABELS: Record<SortOrder, string> = {
  latest: "최신순",
  registered: "등록순",
};

/** 제거 확인창이 다루는 대상. `name` 은 한 곳만 뺄 때 문구에 쓴다. */
type RemoveTarget = { ids: number[]; name?: string };

/**
 * 즐겨찾기 장소 — 저장한 장소를 사진 격자로 훑는 화면.
 *
 * ⚠️ **타임라인에 있던 격자 얼개를 여기로 옮겼다.** 인스타 '저장됨' 이 그렇듯
 * 담아 둔 것을 다시 찾는 화면이 격자에 맞고, 타임라인은 게시물로 읽는 데
 * 집중한다. 타일을 누르면 그 장소가 **타임라인 피드와 같은 게시물 꼴**로 열린다.
 *
 * 종전의 가로 줄 카드(썸네일 + 장소명 + 한줄평 + 날짜 + 휴지통)는 사라졌다.
 * 줄마다 있던 휴지통 자리를 대신하는 것이 헤더 오른쪽의 **선택 모드**다 —
 * 격자에서는 줄이 없어 버튼을 얹을 자리가 없고, 여러 곳을 정리할 때도 한 번에
 * 끝난다.
 */
export function FavoritesPage() {
  const { data, isPending, isError, refetch } = useFavorites();
  const { mutate: removeFavorites, isPending: isRemoving } = useRemoveFavorites();

  const [sortOrder, setSortOrder] = useState<SortOrder>("latest");
  const [selecting, setSelecting] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [openPlace, setOpenPlace] = useState<FavoritePlace | null>(null);
  const [confirming, setConfirming] = useState<RemoveTarget | null>(null);

  const favorites = data?.favorites ?? [];

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

  const toggle = (treeId: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(treeId)) next.delete(treeId);
      else next.add(treeId);
      return next;
    });
  };

  const exitSelecting = () => {
    setSelecting(false);
    setChecked(new Set());
  };

  const handleRemove = () => {
    if (!confirming) return;

    removeFavorites(confirming.ids, {
      onSuccess: ({ removedIds }) => {
        setConfirming(null);
        exitSelecting();

        /*
          게시물 화면에서 뺀 것이라면 그 화면도 닫는다 — 더 이상 즐겨찾기가
          아닌 장소를 즐겨찾기 화면 위에 띄워 둘 이유가 없다. 하나도 못 뺐을
          때는(removedIds 가 비었을 때) 열어 둔 채로 남겨 다시 시도하게 한다.
        */
        if (openPlace && removedIds.includes(openPlace.treeId)) {
          setOpenPlace(null);
        }
      },
      onError: () => setConfirming(null),
    });
  };

  const allChecked = favorites.length > 0 && checked.size === favorites.length;

  return (
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      <header className="px-5 pb-3 pt-header">
        <NavBar
          /* 선택 모드의 × 는 뒤로가기와 같은 40px 흰 원을 쓴다 — 모드가 바뀔 때
             헤더 첫 칸이 흔들리지 않게. */
          leading={
            selecting ? (
              <button
                type="button"
                onClick={exitSelecting}
                aria-label="선택 취소"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-[#2C3930] shadow-[0_2px_6px_rgba(0,0,0,0.15)]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : undefined
          }
          onBack={() => window.history.back()}
          title={selecting ? `${checked.size}곳 선택` : "즐겨찾기 장소"}
          action={
            favorites.length > 0 &&
            (selecting ? (
              <button
                type="button"
                onClick={() =>
                  setChecked(
                    allChecked ? new Set() : new Set(favorites.map((p) => p.treeId)),
                  )
                }
                className="text-[15px] text-[#2C3930]"
              >
                {allChecked ? "선택 해제" : "전체 선택"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelecting(true)}
                className="text-[15px] text-[#2C3930]"
              >
                선택
              </button>
            ))
          }
        />
      </header>

      {/*
        정렬은 화면의 주역이 아닌 보조 전환이라 `ghost` 톤 칩이다(§5). 종전의
        드롭다운은 여는 동작이 한 번 더 있었는데, 고를 것이 둘뿐이라 늘어놓는
        편이 짧다.
      */}
      {favorites.length > 0 && (
        <div role="radiogroup" aria-label="정렬" className="flex gap-1 px-5 pb-3">
          {SORT_ORDERS.map((opt) => (
            <Chip
              key={opt}
              tone="ghost"
              size="sm"
              role="radio"
              aria-checked={sortOrder === opt}
              selected={sortOrder === opt}
              onClick={() => setSortOrder(opt)}
            >
              {SORT_LABELS[opt]}
            </Chip>
          ))}
        </div>
      )}

      {isPending ? (
        <p className="py-10 text-center text-[15px] text-[#60655C]">불러오는 중...</p>
      ) : isError ? (
        <div className="py-10 text-center">
          <p className="text-[15px] text-[#DC2626]">즐겨찾기를 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 rounded-xl bg-[#5B6B38] px-4 py-1.5 text-[13px] font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      ) : favorites.length === 0 ? (
        /*
          담아 둔 것이 없는 상태. 어떻게 담는지를 같이 알려 준다 — 종전에는
          목록 위 초록 배너가 늘 이 문구를 들고 있었는데, 이미 담은 사람에게는
          필요 없는 안내라 정작 필요한 이 자리로 옮겼다.
        */
        <div className="py-10 text-center">
          <p className="text-[15px] text-[#60655C]">즐겨찾기한 장소가 없어요.</p>
          <p className="mt-1 text-[13px] text-[#60655C]">
            지도에서 나무를 탭하면 바로 담을 수 있어요.
          </p>
        </div>
      ) : (
        /* 격자는 인스타 '저장됨' 처럼 좌우 여백 없이 화면 끝까지 채운다. */
        <FavoriteGrid
          places={sortedFavorites}
          selecting={selecting}
          checked={checked}
          onOpen={setOpenPlace}
          onToggle={toggle}
        />
      )}

      {/* 선택 제거 바 — 고른 게 있을 때만 뜬다. */}
      {selecting && checked.size > 0 && (
        <div className="bottom-nav fixed inset-x-0 z-30 mx-auto px-5 sm:max-w-[390px]">
          <button
            type="button"
            onClick={() => setConfirming({ ids: [...checked] })}
            className="flex h-[46px] w-full items-center justify-center rounded-[24px] bg-[#DC2626] text-[15px] font-medium text-white"
          >
            {checked.size}곳 제거
          </button>
        </div>
      )}

      {openPlace && (
        <FavoritePostView
          place={openPlace}
          onClose={() => setOpenPlace(null)}
          onRemove={() =>
            setConfirming({ ids: [openPlace.treeId], name: openPlace.name })
          }
        />
      )}

      {/* 게시물 화면(z-50) 위에서도 열리므로 한 층 위다 — 층 사다리는 Toaster 주석. */}
      {confirming && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-5"
          onClick={() => setConfirming(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[302px] rounded-[20px] bg-[#FFFCEF] px-6 py-6 text-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={trashLargeIcon} alt="" className="mx-auto h-[34px] w-[30px]" />
            <p className="mt-3 text-[17px] font-medium text-[#2C3930]">
              {confirming.ids.length > 1
                ? `선택한 ${confirming.ids.length}곳을 제거할까요?`
                : "즐겨찾기에서 제거할까요?"}
            </p>
            {confirming.name && (
              <p className="mt-1 text-[13px] text-[#2C3930]">{confirming.name}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={isRemoving}
                className="h-[44px] flex-1 rounded-xl bg-[#ECECEC] text-[15px] text-[#2C3930] disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isRemoving}
                className="h-[44px] flex-1 rounded-xl bg-[#DC2626] text-[15px] font-medium text-white disabled:opacity-50"
              >
                {isRemoving ? "제거하는 중" : "제거"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
