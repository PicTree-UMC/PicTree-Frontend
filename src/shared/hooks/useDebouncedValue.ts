import { useEffect, useRef, useState } from 'react';

/**
 * 값이 잠잠해지면 반영하는 디바운스. **`maxWait` 이 있어야 흐르는 값에도 쓸 수 있다.**
 *
 * ⚠️ 순수 디바운스는 여기서 쓸 수 없다. `watchPosition` 은 걷는 동안 1초 남짓마다
 * 새 좌표를 주는데, 그러면 대기 타이머가 계속 리셋돼 **걷는 내내 한 번도 안 터진다.**
 * `maxWait` 은 "아무리 값이 계속 바뀌어도 이 시간마다는 한 번 반영한다" 는 상한이라
 * 그 함정을 막는다.
 *
 * - `delay` 짧게 멈췄을 때 반영되는 시간 — GPS 미세 떨림을 흡수한다
 * - `maxWait` 값이 계속 흘러도 최소 이만큼마다는 반영한다
 *
 * @example
 * // 3초 잠잠하면 반영, 계속 움직여도 15초마다는 반영
 * const settled = useDebouncedValue(coords, 3000, 15000);
 */
export function useDebouncedValue<T>(value: T, delay: number, maxWait?: number): T {
  const [settled, setSettled] = useState(value);

  /** 마지막으로 값을 내보낸 시각. `maxWait` 판정의 기준점. */
  const lastEmittedAt = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    const waited = now - lastEmittedAt.current;

    // maxWait 을 이미 넘겼으면 기다리지 않고 즉시 반영한다.
    if (maxWait != null && waited >= maxWait) {
      lastEmittedAt.current = now;
      setSettled(value);
      return;
    }

    // 남은 maxWait 과 delay 중 먼저 오는 쪽에 맞춘다.
    const wait = maxWait != null ? Math.min(delay, maxWait - waited) : delay;

    const timer = setTimeout(() => {
      lastEmittedAt.current = Date.now();
      setSettled(value);
    }, wait);

    return () => clearTimeout(timer);
  }, [value, delay, maxWait]);

  return settled;
}
