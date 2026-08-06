import { formatBytes } from "../lib/formatBytes";

interface Props {
  /** 사용 중인 용량(byte). 아직 알 수 없으면 null — 지어내지 않고 "-" 로 둔다. */
  usedBytes: number | null;
  /** 요금제 상한(byte) */
  totalBytes: number;
}

/**
 * 사진 저장 용량 카드.
 *
 * 원래 타임라인 상단에 얇은 배너로 있었는데, 기록을 보는 화면에서 요금제 정보가
 * 끼어드는 게 어색해 구독 관리로 옮겼다. 시안(WF-017)에 맞춰 제목·수치·막대·안내
 * 네 줄 구조로 키웠다.
 *
 * 사용량은 서버에 합계 API 가 없어 프론트가 나무별 사진 크기를 더해 구한다
 * (`api/storageApi`). 그 계산이 실패하면 값을 지어내지 않는다 — "기록이 하나도
 * 없는데 절반이 찼다" 같은 화면이 나오므로, 모를 때는 `-` 와 빈 막대로 둔다.
 */
export function StorageCard({ usedBytes, totalBytes }: Props) {
  const isKnown = usedBytes !== null;
  const usedLabel = isKnown ? formatBytes(usedBytes) : "-";
  const ratio = isKnown && totalBytes > 0 ? usedBytes / totalBytes : 0;

  return (
    <section className="rounded-xl border border-[#ECECEC] bg-white px-5 py-4">
      <h2 className="text-[17px] font-medium text-[#2C3930]">사진 저장 용량</h2>

      <p className="mt-1 text-[13px] font-medium text-[#60655C]">
        {usedLabel} / {formatBytes(totalBytes)} 사용 중
      </p>

      <div
        role="progressbar"
        aria-label="사진 저장 용량 사용률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(ratio * 100)}
        className="my-2.5 h-2 w-full overflow-hidden rounded-full bg-[#D9D9D9]"
      >
        <div
          className="h-full rounded-full bg-[#5B6B38] transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />
      </div>

      <p className="text-[13px] font-medium text-[#60655C]">
        사진 없는 기록은 용량 제한 없이 무제한으로 저장돼요.
      </p>
    </section>
  );
}
