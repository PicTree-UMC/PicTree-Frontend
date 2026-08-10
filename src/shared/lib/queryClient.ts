import { QueryClient } from '@tanstack/react-query';

/**
 * 전역 기본값 — **가장 자주 변하는 데이터에 맞춘 하한**이다.
 *
 * ⚠️ **여기 값을 올려서 특정 화면을 고치지 말 것.** 60초는 나무(`['trees']`)처럼 사용자가
 * 그 자리에서 바꾸는 데이터 기준이고, 카탈로그(요금제·약관)에는 터무니없이 짧다. 그런
 * 쿼리는 **자기 훅에서** 더 긴 값을 든다(`useSubscriptionPlans`·`useTerms` 등). 반대로
 * 여기를 올리면 손댄 적 없는 화면까지 낡은 값을 들고 있게 된다.
 *
 * ⚠️ **훅에서 `staleTime: undefined` 를 넘기면 이 값이 죽는다.** 옵션 객체에 키가 있으면
 * 값이 `undefined` 여도 기본값을 덮어써서 "항상 stale" 이 된다 — 실제로 그렇게 새서
 * 탭을 옮길 때마다 `/trees` 가 다시 나갔다(`useAllTrees` 주석).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      /**
       * 캐시를 버리기까지의 시간. 기본 5분은 **탭을 오가는 모바일 웹에 짧다** —
       * 5분 넘게 다른 탭에 있다 돌아오면 캐시가 이미 없어서 로딩을 처음부터 다시 본다.
       *
       * `staleTime` 과 역할이 다르다. `staleTime` 은 "언제 다시 받을까", `gcTime` 은
       * "언제 버릴까" 다. 길게 두면 돌아왔을 때 **옛 값이라도 먼저 그리고** 뒤에서
       * 갱신한다(빈 화면 대신). 메모리는 나무 목록 한 벌 수준이라 30분이 부담되지 않는다.
       */
      gcTime: 1000 * 60 * 30,
      retry: 1,
    },
  },
});
