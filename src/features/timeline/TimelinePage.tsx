import { useState } from "react";
import { useDeleteRecord } from "./hooks/useDeleteRecord";
import { useTimeline } from "./hooks/useTimeline";
import { useUpdateTimeline } from "./hooks/useUpdateTimeline";
import type { TimelineSort } from "./lib/timelineQuery";
import type { TimelineRecord } from "./types/timeline.types";
import { TimelineSearchBar } from "./components/TimelineSearchBar";
import { TimelineSortTabs } from "./components/TimelineSortTabs";
import { TimelinePhotoGroup } from "./components/TimelinePhotoGroup";
import { RecordDetailSheet } from "./components/RecordDetailSheet";
import { TimelineEditModal } from "./components/TimelineEditModal";
import { DeleteRecordModal } from "./components/DeleteRecordModal";
import { useToast } from "@/shared/components";

export function TimelinePage() {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<TimelineSort>("recent");

  const { groups, visibleCount, isLoading, isError, refetch } = useTimeline({ keyword, sort });
  const deleteMutation = useDeleteRecord();
  const updateMutation = useUpdateTimeline();
  const { showToast } = useToast();

  const [detailTarget, setDetailTarget] = useState<TimelineRecord | null>(null);
  const [editTarget, setEditTarget] = useState<TimelineRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineRecord | null>(null);

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

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFCEF] pb-nav">
      <div className="flex flex-col gap-4 px-5 pb-4 pt-6">
        <TimelineSearchBar value={keyword} onChange={setKeyword} />

        {/* 못 불러온 상태에서 "총 0개" 는 기록이 없다는 뜻으로 읽힌다 — 개수·정렬은 숨긴다 */}
        {!isError && (
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[#60655C]">
              {isSearching ? `검색 결과 ${visibleCount}개` : `총 ${visibleCount}개의 기록`}
            </p>
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
              className="mt-2 rounded-xl bg-[#788F4A] px-4 py-1.5 text-xs font-bold text-white"
            >
              다시 시도
            </button>
          </div>
        )}
        {!isLoading && !isError && groups.length === 0 && (
          <p className="py-10 text-center text-sm text-[#60655C]">
            {isSearching
              ? "검색과 일치하는 기록이 없어요."
              : "아직 저장된 기록이 없어요."}
          </p>
        )}

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <TimelinePhotoGroup
              key={group.dateKey}
              group={group}
              onOpenDetail={setDetailTarget}
            />
          ))}
        </div>
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
