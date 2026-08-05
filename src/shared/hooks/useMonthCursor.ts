import { useCallback, useMemo, useState } from 'react';

export type CalendarMonth = { year: number; month: number };

/** 연·월을 한 숫자로 눌러 비교·증감을 쉽게 한다(2026-04 → 24315). */
const toIndex = ({ year, month }: CalendarMonth) => year * 12 + (month - 1);
const fromIndex = (index: number): CalendarMonth => ({
  year: Math.floor(index / 12),
  month: (index % 12) + 1,
});

type UseMonthCursorOptions = {
  /** 처음 열리는 달. 기본은 이번 달. */
  initial?: CalendarMonth;
  /** 이동할 수 있는 범위. 벗어난 쪽 버튼은 잠근다. */
  min?: CalendarMonth;
  max?: CalendarMonth;
};

/**
 * 달력의 '지금 보고 있는 달'.
 *
 * 세 화면(여행 캘린더·블로그 기간 선택·동선 날짜 고르기)이 각자 12월↔1월 넘김을 손으로
 * 짜고 있었다. 연·월을 따로 들면 그 경계에서 실수가 나기 쉬워 **한 숫자(월 인덱스)로 눌러**
 * 더하고 빼기만 한다.
 *
 * `min`/`max` 는 렌더 도중에 바뀔 수 있다 — 동선 날짜 고르기는 **데이터가 도착한 뒤에야**
 * 범위를 안다. 그래서 상태를 고쳐 잡지 않고 **읽을 때마다 범위 안으로 눌러** 돌려준다.
 */
export function useMonthCursor({ initial, min, max }: UseMonthCursorOptions = {}) {
  const [cursor, setCursor] = useState(() =>
    toIndex(
      initial ?? { year: new Date().getFullYear(), month: new Date().getMonth() + 1 },
    ),
  );

  const minIndex = min ? toIndex(min) : Number.NEGATIVE_INFINITY;
  const maxIndex = max ? toIndex(max) : Number.POSITIVE_INFINITY;
  const clamped = Math.min(Math.max(cursor, minIndex), maxIndex);

  const move = useCallback(
    (step: number) => setCursor((current) => Math.min(Math.max(current + step, minIndex), maxIndex)),
    [minIndex, maxIndex],
  );

  const moveTo = useCallback(
    (next: CalendarMonth) => setCursor(Math.min(Math.max(toIndex(next), minIndex), maxIndex)),
    [minIndex, maxIndex],
  );

  const { year, month } = useMemo(() => fromIndex(clamped), [clamped]);

  return {
    year,
    month,
    goPrev: useCallback(() => move(-1), [move]),
    goNext: useCallback(() => move(1), [move]),
    canGoPrev: clamped > minIndex,
    canGoNext: clamped < maxIndex,
    moveTo,
  };
}
