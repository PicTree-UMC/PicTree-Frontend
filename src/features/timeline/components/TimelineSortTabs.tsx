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
 *
 * 칩 규격은 동선 생성 2단계(날짜 칩)와 같은 `Chip` 기본값(`outline` · `md`)이다.
 * 예전엔 `ghost` · `sm` 이라 같은 앱에서 고르는 줄이 두 가지로 보였다(#192).
 */
export function TimelineSortTabs({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="정렬 기준" className="flex items-center gap-2">
      {TIMELINE_SORTS.map(({ key, label }) => {
        const isActive = key === value;

        return (
          // 라디오라서 상태는 `aria-checked` 로 알린다 — Chip 은 `role` 이 있으면
          // `aria-pressed` 를 안 붙인다(한 요소에 두 상태를 겹쳐 알리지 않는다).
          <Chip
            key={key}
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
