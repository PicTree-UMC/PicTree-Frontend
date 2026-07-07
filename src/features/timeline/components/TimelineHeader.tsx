/**
 * 타임라인 상단 헤더 — 총 기록 수 표시
 * 디자인 미확정: 배경색·타이포·여백은 확정 후 반영.
 */
interface Props {
  totalCount: number;
}

export default function TimelineHeader({ totalCount }: Props) {
  return (
    // TODO(디자인): 헤더 배경색/패딩/구분선 등 적용 (예: bg-[#색상코드])
    <header>
      {/* TODO(디자인): 제목 타이포/크기 */}
      <h1>타임라인</h1>
      {/* TODO(디자인): 부제 타이포/색상 */}
      <p>총 {totalCount}개의 기록</p>
    </header>
  );
}