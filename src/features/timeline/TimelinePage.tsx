import { useDeleteRecord } from "./hooks/useDeleteRecord";
import { useTimeline } from "./hooks/useTimeline";
import TimelineHeader from "./components/TimelineHeader";
import FreePlanBanner from "./components/FreePlanBanner";
import TimelineGroup from "./components/TimelineGroup";

/**
 * 타임라인 페이지 
 * 색상은 Figma 값: 페이지 배경 #F7F7FB.
 */
export function TimelinePage() {
  const { groups, totalCount, plan, isLoading, isError } = useTimeline();
  const deleteMutation = useDeleteRecord();

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  return (
    // pb-24: 하단 탭바 높이만큼 여백
    <div className="flex min-h-screen flex-col bg-[#F7F7FB] pb-24">
      {/* 총 기록 수 헤더 */}
      <TimelineHeader totalCount={totalCount} />

      {/* 무료 플랜일 때만 제한 안내 배너 */}
      {plan === "free" && <FreePlanBanner />}

      {/* 상태 분기 (로딩/에러/빈 목록) */}
      {isLoading && (
        <p className="py-10 text-center text-sm text-[#4F4F4F]">불러오는 중...</p>
      )}
      {isError && (
        <p className="py-10 text-center text-sm text-[#FF0000]">
          기록을 불러오지 못했습니다.
        </p>
      )}
      {!isLoading && !isError && groups.length === 0 && (
        <p className="py-10 text-center text-sm text-[#4F4F4F]">
          아직 저장된 기록이 없어요.
        </p>
      )}

      {/* 날짜 그룹 반복 */}
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
