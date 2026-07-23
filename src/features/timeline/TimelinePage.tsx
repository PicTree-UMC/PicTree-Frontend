import { useState } from "react";
import { useDeleteRecord } from "./hooks/useDeleteRecord";
import { useTimeline } from "./hooks/useTimeline";
import type { TimelineRecord } from "./types/timeline.types";
import TimelineHeader from "./components/TimelineHeader";
import StorageBanner from "./components/StorageBanner";
import TimelineGroup from "./components/TimelineGroup";
import { RecordActionSheet } from "./components/RecordActionSheet";
import { DeleteRecordModal } from "./components/DeleteRecordModal";
import { useToast } from "@/shared/components";

export function TimelinePage() {
  const { groups, totalCount, plan, isLoading, isError } = useTimeline();
  const deleteMutation = useDeleteRecord();
  const { showToast } = useToast();

  const [menuTarget, setMenuTarget] = useState<TimelineRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineRecord | null>(null);

  // 저장 용량 배너 값 (mock — 백엔드 연동 시 교체)
  const storage =
    plan === "premium"
      ? { usedLabel: "50MB", totalLabel: "20GB", planLabel: "맥스", usedRatio: 50 / 20000 }
      : { usedLabel: "50MB", totalLabel: "100MB", planLabel: "무료", usedRatio: 50 / 100 };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFCEF] pb-28">
      <TimelineHeader
        totalCount={totalCount}
        plan={plan}
        onUpgrade={() => showToast("구독 및 결제에서 업그레이드할 수 있어요.", "info")}
      />

      <div className="flex flex-col gap-5 px-5 py-4">
        <StorageBanner {...storage} />

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
            아직 저장된 기록이 없어요.
          </p>
        )}

        {groups.map((group) => (
          <TimelineGroup
            key={group.dateKey}
            group={group}
            onOpenMenu={setMenuTarget}
          />
        ))}
      </div>

      {menuTarget && (
        <RecordActionSheet
          record={menuTarget}
          onClose={() => setMenuTarget(null)}
          onEdit={() => {
            showToast("기록 수정은 준비 중이에요.", "info");
            setMenuTarget(null);
          }}
          onChangePhoto={() => {
            showToast("사진 보기/변경은 준비 중이에요.", "info");
            setMenuTarget(null);
          }}
          onFavorite={() => {
            showToast("즐겨찾기에 추가했어요.", "success");
            setMenuTarget(null);
          }}
          onDelete={() => {
            setDeleteTarget(menuTarget);
            setMenuTarget(null);
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
