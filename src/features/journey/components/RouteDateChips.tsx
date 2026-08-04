import { Chip } from '@/shared/components';
import { formatDateLabel } from '../lib/formatDate';

interface RouteDateChipsProps {
  /** 이 동선이 걸친 날짜들. 순서대로 칩이 된다. */
  dates: string[];
  /** 지금 걸린 필터. `null` 이면 전체. */
  filter: string | null;
  onChangeFilter: (date: string | null) => void;
  /**
   * 지금 보이는 장소가 **전부 켜져 있는가**. 버튼이 `전체 해제`/`전체 선택` 중 무엇이 될지
   * 정한다. 버튼 문구는 **누르면 무슨 일이 일어나는지**를 말한다(지금 상태가 아니라).
   */
  allSelected: boolean;
  onToggleAll: () => void;
}

/**
 * 하단 시트의 날짜 필터 줄.
 *
 * **칩은 고르는 게 아니라 거르는 것이다.** 예전엔 칩을 누르면 그날 장소가 통째로 꺼졌는데,
 * 한 손짓에 '보기'와 '넣기/빼기'가 겹쳐 있었다 — 그날만 들여다보려고 눌렀는데 동선에서
 * 빠져버리는 식이다. 지금은 칩이 목록에 보일 날짜만 정하고, 넣고 빼는 일은 옆의 버튼과
 * 각 줄의 탭이 맡는다.
 *
 * 맨 앞 `전체` 는 날짜가 둘 이상일 때만 나온다 — 하나뿐이면 그 칩과 같은 뜻이라 자리만 먹는다.
 *
 * `전체 선택`/`전체 해제` 버튼은 **스크롤 밖에 고정한다**(`JourneyChips` 의 + 버튼과 같은
 * 이유) — 날짜가 많아지면 칩 줄에 딸려 밀려나 사라지는데, 그러면 손이 닿지 않는다.
 */
export function RouteDateChips({
  dates,
  filter,
  onChangeFilter,
  allSelected,
  onToggleAll,
}: RouteDateChipsProps) {
  if (dates.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {dates.length > 1 && (
          <Chip selected={filter === null} onClick={() => onChangeFilter(null)}>
            전체
          </Chip>
        )}

        {dates.map((date) => (
          <Chip key={date} selected={filter === date} onClick={() => onChangeFilter(date)}>
            {formatDateLabel(date)}
          </Chip>
        ))}
      </div>

      {/* 칩이 아니다 — 고르는 게 아니라 한 번 하고 끝나는 동작이라 알약을 입히면 옆의
          필터 칩들과 같은 무리로 읽힌다. 대신 높이만 맞춰 한 줄로 떨어지게 한다. */}
      <button
        type="button"
        onClick={onToggleAll}
        className="h-10 shrink-0 px-1 text-[13px] font-medium text-[#60655c] underline underline-offset-2"
      >
        {allSelected ? '전체 해제' : '전체 선택'}
      </button>
    </div>
  );
}
