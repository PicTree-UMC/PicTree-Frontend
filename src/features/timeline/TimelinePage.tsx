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
import { RecordDetailSheet } from "./components/RecordDetailSheet";
import { TimelineEditModal } from "./components/TimelineEditModal";
import { DeleteRecordModal } from "./components/DeleteRecordModal";
import { EmptyTimeline } from "./components/EmptyTimeline";
import { useToast } from "@/shared/components";

/** 상단 버튼 그룹에 쓰는 돋보기 아이콘. */
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** 격자(3열 그리드) 아이콘 — 피드 상태에서 그리드로 되돌아갈 때 보여 준다. */
function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11.5" y="3" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** 피드(게시물처럼 한 칸씩 크게) 아이콘 — 그리드 상태에서 피드로 갈 때 보여 준다. */
function FeedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="3" y="3" width="14" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3" y="11" width="14" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function TimelinePage() {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<TimelineSort>("recent");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [view, setView] = useState<"grid" | "feed">("grid");

  const { groups, isLoading, isError, refetch } = useTimeline({ keyword, sort });
  const deleteMutation = useDeleteRecord();
  const updateMutation = useUpdateTimeline();
  const favoriteMutation = useToggleTimelineFavorite();
  const { showToast } = useToast();

  const [detailTarget, setDetailTarget] = useState<TimelineRecord | null>(null);
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

  const handleSaveEdit = (values: { title: string; content: string }) => {
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
    // min-h-full: 100vh 는 셸 컬럼을 넘긴다. pt-safe 는 상단 안전영역 확보.
    <div className="flex min-h-full flex-col bg-[#FFFCEF] pb-nav">
      <div className="flex flex-col gap-4 px-5 pb-5 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
        {/*
          평소엔 좌측 타이틀 + 우측 버튼 그룹(검색·레이아웃)을 둔다. 돋보기를 누르면
          이 헤더 자리를 통째로 검색바가 차지하고, 우측 취소로 다시 헤더로 돌아온다.

          두 상태를 같은 고정 높이(h-11 = 검색바 높이) 안에 두어야 전환할 때 헤더가
          위아래로 튀지 않는다.
        */}
        <div className="flex h-11 items-center">
          {isSearchOpen ? (
            <div className="flex w-full items-center gap-2">
              <div className="min-w-0 flex-1">
                <TimelineSearchBar value={keyword} onChange={setKeyword} />
              </div>
              <button
                type="button"
                onClick={toggleSearch}
                className="shrink-0 text-[15px] text-[#2C3930]"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <h1 className="text-[20px] font-medium text-[#2C3930]">타임라인</h1>
              {/*
                기록이 하나도 없으면 검색·보기 전환을 숨긴다. 걸러 줄 것도, 다르게
                보여 줄 것도 없어서 눌러도 아무 일이 일어나지 않는 버튼이다.
                기록이 하나라도 생기면 그대로 돌아온다.
              */}
              {!isEmpty && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleSearch}
                  aria-label="검색"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#2C3930] transition-colors hover:bg-[#EDE7D2]"
                >
                  <SearchIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setView((v) => (v === "grid" ? "feed" : "grid"))}
                  aria-label={view === "grid" ? "피드로 보기" : "그리드로 보기"}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#2C3930] transition-colors hover:bg-[#EDE7D2]"
                >
                  {view === "grid" ? <FeedIcon /> : <GridIcon />}
                </button>
              </div>
              )}
            </div>
          )}
        </div>

        {/* 못 불러온 상태·기록이 없는 상태에서는 정렬을 숨긴다 — 줄 세울 목록이 없다. */}
        {!isError && !isEmpty && (
          <div className="flex justify-end">
            <TimelineSortTabs value={sort} onChange={setSort} />
          </div>
        )}

        {isLoading && (
          <p className="py-10 text-center text-sm text-[#60655C]">불러오는 중...</p>
        )}
        {isError && (
          <div className="py-10 text-center">
            <p className="text-sm text-[#DC2626]">기록을 불러오지 못했어요.</p>
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
          <p className="py-10 text-center text-sm text-[#60655C]">
            검색과 일치하는 기록이 없어요.
          </p>
        )}

      </div>

      {/* 헤더 아래 남은 높이를 새싹이 차지한다 — 위로 붙으면 화면이 비어 보인다. */}
      {isEmpty && <EmptyTimeline />}

      {/* 사진 그리드는 인스타 돋보기 탭처럼 좌우 여백 없이 화면 끝까지 채운다. */}
      <div className="flex flex-col gap-5 pb-4">
        {groups.map((group) => (
          <TimelinePhotoGroup
            key={group.dateKey}
            group={group}
            view={view}
            onOpenDetail={setDetailTarget}
            onToggleFavorite={handleToggleFavorite}
            onEdit={setEditTarget}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

      {detailTarget && (
        <RecordDetailSheet
          record={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={() => {
            // 상세 시트는 닫고 수정 모달로 넘긴다. 두 시트가 겹쳐 뜨지 않게.
            setEditTarget(detailTarget);
            setDetailTarget(null);
          }}
          onDelete={() => {
            setDeleteTarget(detailTarget);
            setDetailTarget(null);
          }}
        />
      )}

      {editTarget && (
        <TimelineEditModal
          record={editTarget}
          isSaving={updateMutation.isPending}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleteTarget && (
        <DeleteRecordModal
          record={deleteTarget}
          isDeleting={deleteMutation.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

    </div>
  );
}
