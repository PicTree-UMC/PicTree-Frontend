import { useState } from "react";
import { useDeleteRecord } from "./hooks/useDeleteRecord";
import { useTimeline } from "./hooks/useTimeline";
import type { TimelineSort } from "./lib/timelineQuery";
import type { TimelineRecord } from "./types/timeline.types";
import { TimelineSearchBar } from "./components/TimelineSearchBar";
import { TimelineSortTabs } from "./components/TimelineSortTabs";
import { TimelinePhotoGroup } from "./components/TimelinePhotoGroup";
import { RecordDetailSheet } from "./components/RecordDetailSheet";
import { DeleteRecordModal } from "./components/DeleteRecordModal";
import { useToast } from "@/shared/components";

export function TimelinePage() {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<TimelineSort>("recent");

  const { groups, visibleCount, isLoading, isError } = useTimeline({ keyword, sort });
  const deleteMutation = useDeleteRecord();
  const { showToast } = useToast();

  const [detailTarget, setDetailTarget] = useState<TimelineRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineRecord | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  // 검색 결과가 없는 것과 기록 자체가 없는 것은 다른 상황이라 문구를 나눈다.
  const isSearching = keyword.trim().length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFCEF] pb-28">
      <div className="flex flex-col gap-4 px-5 pb-4 pt-6">
        <TimelineSearchBar value={keyword} onChange={setKeyword} />

        <div className="flex items-center justify-between">
          <p className="text-[12px] text-[#8D8D8D]">
            {isSearching ? `검색 결과 ${visibleCount}개` : `총 ${visibleCount}개의 기록`}
          </p>
          <TimelineSortTabs value={sort} onChange={setSort} />
        </div>

        {isLoading && (
          <p className="py-10 text-center text-sm text-[#8D8D8D]">불러오는 중...</p>
        )}
        {isError && (
          <p className="py-10 text-center text-sm text-[#FF5858]">
            기록을 불러오지 못했습니다.
          </p>
        )}
        {!isLoading && !isError && groups.length === 0 && (
          <p className="py-10 text-center text-sm text-[#8D8D8D]">
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
            showToast("기록 수정은 준비 중이에요.", "info");
            setDetailTarget(null);
          }}
          onDelete={() => {
            setDeleteTarget(detailTarget);
            setDetailTarget(null);
          }}
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
