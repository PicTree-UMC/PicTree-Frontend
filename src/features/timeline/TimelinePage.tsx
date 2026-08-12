import { useState } from "react";
import { useDeleteRecord } from "./hooks/useDeleteRecord";
import { useTimeline } from "./hooks/useTimeline";
import { useUpdateTimeline } from "./hooks/useUpdateTimeline";
import { useToggleTimelineFavorite } from "./hooks/useToggleTimelineFavorite";
import type { TimelineSort } from "./lib/timelineQuery";
import type { TimelineRecord } from "./types/timeline.types";
import { TimelineSearchBar } from "./components/TimelineSearchBar";
import { TimelineSortTabs } from "./components/TimelineSortTabs";
import { TimelinePhotoGroup } from "./components/TimelinePhotoGroup";
import { TimelineSkeleton } from "./components/TimelineSkeleton";
import { TimelineEditView, type TimelineEditValues } from "./components/TimelineEditView";
import { EmptyTimeline } from "./components/EmptyTimeline";
import { DeleteConfirmModal, useToast } from "@/shared/components";
import { usePageScroll } from "@/shared/hooks/usePageScroll";

/** 헤더 오른쪽 검색 버튼의 돋보기 아이콘. */
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 기록을 게시물로 읽는 화면.
 *
 * ⚠️ **격자(3열 그리드)로 보는 모드는 즐겨찾기 장소로 옮겼다.** 사진을 격자로
 * 훑는 건 저장해 둔 장소를 다시 찾는 일이라 즐겨찾기 쪽이 맞고, 타임라인은
 * 게시물 형태로 읽는 데 집중한다. 보기 전환 버튼과, 격자에서만 열리던 상세
 * 시트(`RecordDetailSheet`)도 같이 없앴다.
 */
export function TimelinePage() {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<TimelineSort>("recent");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { groups, isLoading, isError, refetch } = useTimeline({ keyword, sort });
  const deleteMutation = useDeleteRecord();
  const updateMutation = useUpdateTimeline();
  const favoriteMutation = useToggleTimelineFavorite();
  const { showToast } = useToast();
  const { scrollToTop } = usePageScroll();

  /**
   * 정렬을 바꾸면 **맨 위 — 첫 사진 — 으로 되돌린다.**
   *
   * 목록이 통째로 뒤집히는데 스크롤만 그 자리에 남으면, 눌렀을 때 눈에 들어오는 건
   * 앞뒤 맥락 없는 중간 어딘가다. 순서가 바뀐 게 아니라 사진이 제멋대로 갈린 것처럼
   * 읽혀서 "정렬이 안 먹는다" 로 느껴진다. 새 순서는 첫 장부터 보여야 뜻이 통한다.
   *
   * 맨 위까지만 간다 — 첫 게시물에 딱 맞춰 붙이면 정렬 칩이 화면 밖으로 밀려서,
   * 방금 누른 것을 되돌릴 방법이 사라진다.
   *
   * 이미 켜져 있는 칩을 다시 누른 경우는 거른다. 바뀐 게 없는데 화면만 움직이면
   * 사용자가 보고 있던 자리를 이유 없이 빼앗는 꼴이다.
   */
  const handleSortChange = (next: TimelineSort) => {
    if (next === sort) return;
    setSort(next);
    scrollToTop();
  };

  const [editTarget, setEditTarget] = useState<TimelineRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineRecord | null>(null);

  const handleToggleFavorite = (record: TimelineRecord) => {
    // 나무 없는 기록엔 하트를 안 띄우지만, 방어적으로 한 번 더 막는다.
    if (record.treeId == null) return;
    favoriteMutation.mutate({
      id: record.id,
      treeId: record.treeId,
      isFavorite: !!record.isFavorite,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleSaveEdit = (values: TimelineEditValues) => {
    if (!editTarget) return;

    updateMutation.mutate(
      { timelineId: editTarget.id, payload: values },
      {
        // 실패는 훅이 토스트로 알린다. 성공했을 때만 닫아야 입력값이 안 날아간다.
        onSuccess: () => {
          setEditTarget(null);
          showToast("기록을 수정했어요.", "success");
        },
      },
    );
  };

  // 검색 결과가 없는 것과 기록 자체가 없는 것은 다른 상황이라 문구를 나눈다.
  const isSearching = keyword.trim().length > 0;

  /**
   * 기록이 정말 하나도 없는 상태.
   *
   * 검색 중이면 여기 해당하지 않는다 — 그건 기록이 없는 게 아니라 이번 검색어에
   * 안 걸린 것뿐이라, 새싹과 "첫 기록 남기기" 를 띄우면 사실과 어긋난다.
   */
  const isEmpty = !isLoading && !isError && !isSearching && groups.length === 0;

  // 검색바를 닫으면 숨은 채로 목록이 걸러진 상태가 남지 않도록 키워드도 비운다.
  const toggleSearch = () => {
    setIsSearchOpen((open) => {
      if (open) setKeyword("");
      return !open;
    });
  };

  return (
    // min-h-full: 100vh 는 셸 컬럼을 넘긴다. 상단 안전영역은 안쪽 pt-header 가 갖는다.
    <div className="flex min-h-full flex-col bg-cream pb-nav">
      {/*
        ⚠️ 기록이 없을 때는 머리글을 동선·블로그와 **같은 치수**(`pb-3` + 제목 한 줄)로
        둔다. 빈 화면은 머리글 아래 남은 높이의 가운데에 서므로, 머리글이 22px 높으면
        그만큼 새싹과 문구가 다른 탭과 어긋난다(이슈 #274).
      */}
      <div className={`flex flex-col gap-4 px-5 pt-header ${isEmpty ? 'pb-3' : 'pb-5'}`}>
        {/*
          평소엔 좌측 타이틀 + 우측 검색 버튼을 둔다. 돋보기를 누르면
          이 헤더 자리를 통째로 검색바가 차지하고, 우측 취소로 다시 헤더로 돌아온다.

          두 상태를 같은 고정 높이(h-11 = 검색바 높이) 안에 두어야 전환할 때 헤더가
          위아래로 튀지 않는다.

          ⚠️ 기록이 없으면 그 고정 높이를 뺀다. 검색 버튼 자체가 숨겨져 있어(아래) 검색바가
          열릴 수 없으니, 튐을 막을 것이 없는데 44px 만 잡아먹는다.
        */}
        <div className={`flex items-center ${isEmpty ? '' : 'h-11'}`}>
          {isSearchOpen ? (
            <div className="flex w-full items-center gap-2">
              <div className="min-w-0 flex-1">
                <TimelineSearchBar value={keyword} onChange={setKeyword} />
              </div>
              <button
                type="button"
                onClick={toggleSearch}
                className="shrink-0 text-[15px] text-ink"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <h1 className="text-[20px] font-medium text-ink">타임라인</h1>
              {/*
                기록이 하나도 없으면 검색을 숨긴다. 걸러 줄 것이 없어서 눌러도
                아무 일이 일어나지 않는 버튼이다. 기록이 하나라도 생기면 돌아온다.
              */}
              {!isEmpty && (
                <button
                  type="button"
                  onClick={toggleSearch}
                  aria-label="검색"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-deep"
                >
                  <SearchIcon />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 못 불러온 상태·기록이 없는 상태에서는 정렬을 숨긴다 — 줄 세울 목록이 없다. */}
        {!isError && !isEmpty && (
          <div className="flex">
            <TimelineSortTabs value={sort} onChange={handleSortChange} />
          </div>
        )}

        {/*
          로딩 자리는 여기가 아니라 피드 쪽이다 — 골격이 사진 폭을 그대로 써야 해서
          가로 여백이 있는 이 머리글 블록 안에 둘 수 없다.
        */}
        {isError && (
          <div className="py-10 text-center">
            <p className="text-[15px] text-error">기록을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 rounded-xl bg-pictree-700 px-4 py-1.5 text-[13px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        )}
        {!isLoading && !isError && isSearching && groups.length === 0 && (
          <p className="py-10 text-center text-[15px] text-ink-muted">
            검색과 일치하는 기록이 없어요.
          </p>
        )}

      </div>

      {/* 헤더 아래 남은 높이를 새싹이 차지한다 — 위로 붙으면 화면이 비어 보인다. */}
      {isEmpty && <EmptyTimeline />}

      {/*
        게시물은 인스타 피드처럼 좌우 여백 없이 화면 끝까지 채운다.

        ⚠️ 기록이 없으면 이 묶음 자체를 걸러 낸다. 안이 비어도 `pb-4` 만큼(16px) 자리를
        차지해서, 위 빈 화면이 쓸 수 있는 높이가 다른 탭보다 그만큼 짧아진다 — 새싹과
        문구가 다른 탭보다 조금 높게 서 있던 이유다(이슈 #274).
      */}
      {isLoading ? (
        <TimelineSkeleton />
      ) : isEmpty ? null : (
        <div className="flex flex-col gap-5 pb-4">
          {groups.map((group) => (
            <TimelinePhotoGroup
              key={group.dateKey}
              group={group}
              sort={sort}
              onToggleFavorite={handleToggleFavorite}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {editTarget && (
        <TimelineEditView
          record={editTarget}
          isSaving={updateMutation.isPending}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          isOpen
          title="이 장소를 삭제할까요?"
          /*
            ⚠️ 문구가 '타임라인 제거' 에서 '장소 삭제' 로 바뀐 이유 (#123).

            통합 전에는 기록만 지워지고 나무는 지도에 남았다. 지금은 기록이 곧 나무라
            `DELETE /trees/{treeId}` 가 나가고 **지도의 장소까지 함께 사라진다.**
            예전 문구를 그대로 두면 "타임라인에서만 빠지겠지" 로 읽고 누르게 된다 —
            되돌릴 방법이 없는 동작이라 결과를 먼저 말해야 한다.
          */
          description={
            <>
              {deleteTarget.placeName}
              <br />
              지도에서도 사라지고 되돌릴 수 없어요.
            </>
          }
          isDeleting={deleteMutation.isPending}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

    </div>
  );
}
