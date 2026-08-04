import { formatDateLabel } from '../lib/formatDate';

interface RouteDateChipsProps {
  selectedDates: string[];
  /** 그날 장소가 전부 꺼져 있는 날짜. 칩은 남고 반투명해진다(화면설계서 6·7번). */
  disabledDates: ReadonlySet<string>;
  onToggleDate: (dateKey: string) => void;
  className?: string;
}

/**
 * 하단 시트의 날짜 칩 줄(`RoutePlaceStrip` 안). 예전엔 지도 위 헤더에 떠 있었는데,
 * 날짜 켜고 끄기와 장소 켜고 끄기가 화면 위아래 끝으로 갈라져 있어서 시트로 내렸다.
 *
 * 칩을 누르면 그날 동선이 꺼진다(화면설계서 6번). **날짜를 고르는 일은 이 줄이 하지 않는다** —
 * 그건 앞 단계(`RouteCreatePage`)의 몫이고, 여기서 바꾸려면 뒤로 가면 된다. 그래서 예전에
 * 이 줄 위에 얹혀 있던 `날짜 관리 n/3일` 알약이 사라졌다.
 *
 * **꺼진 날짜도 칩은 남긴다** — 지워버리면 되돌릴 길이 앞 단계뿐이라, 반투명하게 두고
 * 다시 누르면 살아나게 한다.
 */
export function RouteDateChips({
  selectedDates,
  disabledDates,
  onToggleDate,
  className = '',
}: RouteDateChipsProps) {
  if (selectedDates.length === 0) return null;

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden ${className}`}>
      {selectedDates.map((date) => {
        const disabled = disabledDates.has(date);

        return (
          <button
            key={date}
            type="button"
            onClick={() => onToggleDate(date)}
            aria-pressed={!disabled}
            aria-label={`${formatDateLabel(date)} 동선 ${disabled ? '켜기' : '끄기'}`}
            // h-10: 아래 장소 칩(44px)보다 한 단 낮다 — 날짜가 상위 필터인데 같은 높이면
            // 두 줄이 한 덩어리로 뭉쳐 어느 쪽이 큰 단위인지 안 읽힌다.
            className={`flex h-10 shrink-0 items-center rounded-[10px] px-4 text-[15px] font-medium transition-colors ${
              disabled
                ? 'bg-[#fffcef]/45 text-[#2c3930]/40'
                : 'bg-[#fffcef]/90 text-[#2c3930] shadow-[0_2px_6px_rgba(0,0,0,0.15)]'
            }`}
          >
            {formatDateLabel(date)}
          </button>
        );
      })}
    </div>
  );
}
