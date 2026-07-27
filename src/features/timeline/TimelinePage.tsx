import { useState } from "react";
import { useDeleteRecord } from "./hooks/useDeleteRecord";
import { useTimeline } from "./hooks/useTimeline";
import type { TimelineRecord } from "./types/timeline.types";
import TimelineHeader from "./components/TimelineHeader";
import StorageBanner from "./components/StorageBanner";
import TimelineGroup from "./components/TimelineGroup";
import { RecordActionSheet } from "./components/RecordActionSheet";
import { DeleteRecordModal } from "./components/DeleteRecordModal";
import { TimelineEditModal } from "./components/TimelineEditModal";
import { useUpdateTimeline } from "./hooks/useUpdateTimeline";
import { useToast } from "@/shared/components";

export function TimelinePage() {
  const { groups, totalCount, plan, isLoading, isError } = useTimeline();
  const deleteMutation = useDeleteRecord();
  const updateMutation = useUpdateTimeline();
  const { showToast } = useToast();

  const [menuTarget, setMenuTarget] = useState<TimelineRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineRecord | null>(null);
  const [editTarget, setEditTarget] = useState<TimelineRecord | null>(null);

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
            setEditTarget(menuTarget);
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
