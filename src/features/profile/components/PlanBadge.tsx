import crownIcon from "../assets/icons/crown.svg";

interface Props {
  /** "무료" / "맥스" 같은 짧은 플랜 이름 */
  planName: string;
  /** 유료 플랜에만 있는 요약 두 칸. 무료면 넘기지 않는다. */
  summary?: { label: string; value: string }[];
  /** "다음 결제: 2026년 5월 29일" 같은 보조 문구 */
  note?: string | null;
}

/**
 * 화면 맨 위의 현재 플랜 표시.
 *
 * 시안(WF-017)에서 무료와 유료가 같은 자리를 쓰되 유료만 요약 칸(결제금액·용량)과
 * 다음 결제일이 더 붙는다. 두 화면을 따로 만들지 않고 한 컴포넌트로 처리한다.
 */
export function PlanBadge({ planName, summary, note }: Props) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2">
        <img src={crownIcon} alt="" className="h-7 w-7" />
        <span className="text-xs font-medium text-[#2C3930]">현재 플랜</span>
        <span className="text-lg font-bold text-black">{planName}</span>
      </div>

      {summary && summary.length > 0 && (
        <div className="mt-3 flex gap-3">
          {summary.map(({ label, value }) => (
            <div
              key={label}
              className="min-w-[104px] rounded-lg border border-[#C5D89D] bg-white px-3 py-1.5 text-center"
            >
              <p className="text-[10px] font-medium text-[#90908F]">{label}</p>
              <p className="text-[13px] font-bold text-[#2C3930]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {note && <p className="mt-2 text-[10px] text-[#898888]">{note}</p>}
    </div>
  );
}
