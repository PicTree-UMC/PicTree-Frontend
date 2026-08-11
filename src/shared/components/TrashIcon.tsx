import { TRASH_GLYPH } from './trashGlyph';

interface TrashIconProps {
  /** 크기·색. 색은 `currentColor` 로 도므로 `text-error` 처럼 글자색으로 준다. */
  className?: string;
  /**
   * 선 굵기(24 좌표계 기준). 크게 그리는 자리는 그만큼 선도 굵어지므로,
   * 30px 넘게 키울 때는 기본값보다 올리지 않는 편이 맞다.
   */
  strokeWidth?: number;
}

/**
 * 혼자 서는 휴지통 — 삭제 확인 모달의 머리 아이콘, 목록의 삭제 버튼.
 *
 * 글리프는 앱에 하나뿐인 `TRASH_GLYPH`(lucide `trash`)를 쓴다.
 *
 * 한 줄에 하트·연필과 나란히 놓는 액션 줄에서는 이걸 쓰지 않는다 — 거기서는
 * `IconFrame` 이 글리프 크기를 서로 맞춰야 해서 `TRASH_GLYPH`·`TRASH_BOX` 를
 * 직접 넘긴다.
 */
export function TrashIcon({ className = 'h-6 w-6', strokeWidth = 1.8 }: TrashIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={TRASH_GLYPH} />
    </svg>
  );
}
