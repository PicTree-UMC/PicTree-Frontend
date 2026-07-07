import { useDeleteRecord } from "./hooks/useDeleteRecord";
import { useTimeline } from "./hooks/useTimeline";
import TimelineHeader from "./components/TimelineHeader";
import FreePlanBanner from "./components/FreePlanBanner";
import TimelineGroup from "./components/TimelineGroup";

/**
 * 타임라인 페이지 (하단바 [타임라인] → 진입)
 *
 * 이 파일은 "조립"만 담당(데이터=훅, 화면 조각=components).
 * 디자인 미확정: 색상/여백/타이포 등 스타일은 확정 후 className 에 채울예정.
 */
export default function TimelinePage() {
  const { groups, totalCount, plan, isLoading, isError } = useTimeline();
  const deleteMutation = useDeleteRecord();

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  return (
    // TODO(디자인): 페이지 배경색, 하단 여백(탭바 높이만큼) 등 적용
    <div className="flex min-h-screen flex-col">
      {/* 총 기록 수 헤더 */}
      <TimelineHeader totalCount={totalCount} />

      {/* 무료 플랜일 때만 제한 안내 배너 */}
      {plan === "free" && <FreePlanBanner />}

      {/* 상태 분기 — 문구만 두고 스타일은 디자인 확정 시 */}
      {isLoading && <p>{/* TODO(디자인): 로딩 표시 */}불러오는 중...</p>}
      {isError && <p>{/* TODO(디자인): 에러 표시 */}기록을 불러오지 못했습니다.</p>}
      {!isLoading && !isError && groups.length === 0 && (
        <p>{/* TODO(디자인): 빈 상태 표시 */}아직 저장된 기록이 없어요.</p>
      )}

      {/* 날짜 그룹 반복 (최신순) */}
      {groups.map((group) => (
        <TimelineGroup
          key={group.dateKey}
          group={group}
          onDelete={handleDelete}
          deletingId={
            deleteMutation.isPending
              ? (deleteMutation.variables as string)
              : null
          }
        />
      ))}
    </div>
  );
}