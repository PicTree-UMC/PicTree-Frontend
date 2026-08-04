import { Chip } from '@/shared/components';
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
          // 시트 바닥이 흰색이 되면서 기본 톤(`outline`)으로 왔다 — 크림 칩은 흰 위에서
          // 안 보인다. 꺼진 칩도 흰 알약 + 연초록 테두리로 남아 다시 누를 수 있게 보인다.
          <Chip
            key={date}
            selected={!disabled}
            onClick={() => onToggleDate(date)}
            aria-label={`${formatDateLabel(date)} 동선 ${disabled ? '켜기' : '끄기'}`}
          >
            {formatDateLabel(date)}
          </Chip>
        );
      })}
    </div>
  );
}
