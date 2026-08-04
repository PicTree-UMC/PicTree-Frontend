import { Chip } from '@/shared/components';
import { TIMELINE_SORTS, type TimelineSort } from '../lib/timelineQuery';

interface Props {
  value: TimelineSort;
  onChange: (sort: TimelineSort) => void;
}

/**
 * 최신순 / 등록순 전환.
 *
 * 라디오 그룹으로 노출한다 — 버튼 두 개를 나열하면 스크린리더가 "무엇 중 하나를
 * 고르는 상황" 인지 알 수 없다.
 */
export function TimelineSortTabs({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="정렬 기준" className="flex items-center gap-1">
      {TIMELINE_SORTS.map(({ key, label }) => {
        const isActive = key === value;

        return (
          // 화면의 주역이 아닌 보조 전환이라 `ghost` + `sm`. 라디오라서 상태는
          // `aria-checked` 로 알리고, Chip 은 `role` 이 있으면 `aria-pressed` 를 안 붙인다.
          <Chip
            key={key}
            tone="ghost"
            size="sm"
            role="radio"
            aria-checked={isActive}
            selected={isActive}
            onClick={() => onChange(key)}
          >
            {label}
          </Chip>
        );
      })}
    </div>
  );
}
