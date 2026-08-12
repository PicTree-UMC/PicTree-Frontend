import { Photo } from "@/shared/components";

import type { FavoritePlace } from "../types/favorite";

interface Props {
  places: FavoritePlace[];
  /** 선택 모드에서는 타일을 눌러도 게시물이 열리지 않고 체크만 토글된다. */
  selecting: boolean;
  checked: Set<number>;
  onOpen: (place: FavoritePlace) => void;
  onToggle: (treeId: number) => void;
}

/** 고른 타일의 체크 표시. */
function CheckMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="#FFFCEF"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l5 5 9-10" />
    </svg>
  );
}

/**
 * 저장한 장소를 사진 격자로 — 타임라인에 있던 격자 얼개를 그대로 가져왔다
 * (3열 · 2px 갭 · 3:4 세로). 인스타 '저장됨' 처럼 사진이 화면 끝까지 닿아야
 * 해서 부모가 좌우 여백 없이 놓는다.
 *
 * 타일을 누르면 그 장소가 게시물로 열린다. 선택 모드에서는 대신 체크가 켜진다 —
 * 한 화면에서 두 동작을 다 받으면 누를 때마다 무엇이 일어날지 알 수 없어서,
 * 모드로 갈랐다.
 */
export function FavoriteGrid({ places, selecting, checked, onOpen, onToggle }: Props) {
  return (
    <ul className="grid grid-cols-3 gap-0.5">
      {places.map((place) => {
        const isChecked = checked.has(place.treeId);

        return (
          <li key={place.treeId}>
            <button
              type="button"
              onClick={() => (selecting ? onToggle(place.treeId) : onOpen(place))}
              aria-label={selecting ? place.name : `${place.name} 게시물 보기`}
              aria-pressed={selecting ? isChecked : undefined}
              className="relative block aspect-[3/4] w-full overflow-hidden bg-cream-deep"
            >
              {/*
                사진이 없거나 **못 불러와도** 이름을 대신 채운다. 빈 칸으로 두면 어디였는지
                알 길이 없어서다 — 사진이 있는 타일에는 이름을 얹지 않는다.
                폴백이 나무가 아닌 이유: 격자에 나무만 여러 개 뜨면 서로 구분이 안 된다.
              */}
              <Photo
                src={place.imageUrl}
                className="h-full w-full object-cover"
                fallback={
                  <span className="flex h-full w-full items-center justify-center px-2">
                    <span className="line-clamp-3 text-[13px] text-ink-muted">
                      {place.name}
                    </span>
                  </span>
                }
              />

              {selecting && (
                <>
                  {/* 고른 사진을 어둡게 덮어 안 고른 것과 갈라 보이게 한다. */}
                  {isChecked && <span aria-hidden className="absolute inset-0 bg-black/35" />}

                  {/*
                    안 고른 원은 흰 테두리 + 옅은 그늘이다. 사진마다 밝기가 달라
                    한 가지 색 테두리만으로는 밝은 사진 위에서 사라진다.
                  */}
                  <span
                    aria-hidden
                    className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      isChecked
                        ? "border-pictree-700 bg-pictree-700"
                        : "border-white bg-black/20"
                    }`}
                  >
                    {isChecked && <CheckMark />}
                  </span>
                </>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
