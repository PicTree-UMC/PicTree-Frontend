/**
 * 타임라인 상단 헤더 — 총 기록 수 표시
 * 색상은 Figma 값: 밴드 #BAD0C1.
 */
interface Props {
  totalCount: number;
}

export default function TimelineHeader({ totalCount }: Props) {
  return (
    <header className="bg-[#BAD0C1] px-4 py-3">
      <h1 className="text-base font-semibold text-black">타임라인</h1>
      <p className="text-sm text-black">
        총 <span className="italic">{totalCount}</span>개의 기록
      </p>
    </header>
  );
}
