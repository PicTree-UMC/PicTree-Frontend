import type { Route } from '@/features/route/types/route';

type RouteStepProps = {
  routes: Route[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  selectedRouteId: number | null;
  onSelect: (routeId: number) => void;
  /** 고른 동선의 내용을 받는 중 — '다음' 을 잠근다. */
  isDetailPending: boolean;
  isDetailError: boolean;
  /** 초안에 들어갈 기록 수. 상세를 받아야 확정된다. */
  treeCount: number;
  canGoNext: boolean;
  onNext: () => void;
  /** 저장한 동선이 없을 때 동선 만들기로 보낸다. */
  onCreateRoute: () => void;
};

/** 선택된 동선에 붙는 체크 배지. */
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 13 4 4 10-11" />
    </svg>
  );
}

/**
 * 1단계 — **저장한 동선 고르기**.
 *
 * ⚠️ 종전 1단계는 기간을 고르는 화면이었고(`DateStep`), 그 기간의 기록이 전부 자동
 * 선택돼 초안 입력이 됐다. 양을 아무도 통제하지 못하던 자리다(이슈 #212). 지금은 **한
 * 여행 = 한 동선**이 입력 단위라 고를 것이 하나뿐이고, 기간·기록은 동선에서 파생된다.
 *
 * 그래서 **여기에는 기록을 하나씩 켜고 끄는 장치를 두지 않는다.** 그걸 되살리면 동선이
 * 의도한 범위를 다시 흐트러뜨리게 되고, 무엇이 들어갈지는 동선 화면에서 이미 정한 것이다.
 * 대신 카드가 장소 이름을 보여줘 무엇이 들어가는지 읽히게 한다.
 */
export function RouteStep({
  routes,
  isPending,
  isError,
  onRetry,
  selectedRouteId,
  onSelect,
  isDetailPending,
  isDetailError,
  treeCount,
  canGoNext,
  onNext,
  onCreateRoute,
}: RouteStepProps) {
  if (isPending) {
    return (
      <div className="grid flex-1 place-items-center" role="status" aria-label="동선을 불러오는 중">
        <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <p className="text-[15px] text-[#60655c]">동선을 불러오지 못했어요.</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-pictree-700 px-5 py-3 text-[15px] font-medium text-white"
        >
          다시 시도
        </button>
      </div>
    );
  }

  /*
    저장한 동선이 없으면 **여기서 할 수 있는 일이 없다.** 빈 목록을 보여주고 '다음' 을
    비활성으로 두면 사용자는 왜 막혔는지 모른 채 서 있게 되므로, 동선 만들기로 보낸다.
  */
  if (routes.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-6 text-center">
        <p className="text-[16px] font-medium text-[#2c3930]">아직 저장한 동선이 없어요</p>
        <p className="mt-2 text-[15px] leading-6 text-[#60655c]">
          블로그 초안은 저장한 동선 하나를 통째로 옮겨 적어요.
          <br />
          먼저 다녀온 곳을 동선으로 묶어주세요.
        </p>
        <button
          type="button"
          onClick={onCreateRoute}
          className="mt-7 h-[54px] w-full max-w-[320px] rounded-xl bg-pictree-700 text-[16px] font-medium text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)]"
        >
          동선 만들러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-5 pb-6 pt-2">
      <p className="text-[15px] leading-6 text-[#60655c]">블로그로 만들 동선을 골라주세요.</p>

      <ul className="mt-4 flex flex-col gap-2.5">
        {routes.map((route) => {
          const selected = route.id === selectedRouteId;

          return (
            <li key={route.id}>
              <button
                type="button"
                onClick={() => onSelect(route.id)}
                aria-pressed={selected}
                className={`flex w-full items-start gap-3 rounded-2xl border bg-white px-5 py-[18px] text-left transition active:scale-[0.99] ${
                  selected
                    ? 'border-pictree-700 shadow-[0_6px_18px_rgba(45,51,34,0.10)]'
                    : 'border-pictree-100 shadow-[0_6px_18px_rgba(45,51,34,0.06)]'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[16px] font-medium text-[#2c3930]">{route.title}</span>
                    <span className="shrink-0 rounded-full bg-pictree-100 px-2 py-[1px] text-[13px] font-medium text-pictree-700">
                      {route.placeCount}곳
                    </span>
                  </span>
                  <span className="mt-1 block text-[13px] text-[#60655c]">{route.date}</span>
                  {/*
                    목록 응답의 `places` 는 미리보기용이라 잘려 올 수 있다 — 그래서 개수는
                    위 배지의 `placeCount`(서버 값)를 쓰고 여기서는 이름만 늘어놓는다.
                  */}
                  {route.places.length > 0 && (
                    <span className="mt-2 block truncate text-[13px] text-[#8a8f86]">
                      {route.places.map((place) => place.name).join(' · ')}
                    </span>
                  )}
                </span>

                <span
                  className={`mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition ${
                    selected
                      ? 'border-pictree-700 bg-pictree-700 text-white'
                      : 'border-[#d4d4d4] bg-white text-transparent'
                  }`}
                >
                  <CheckIcon />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* 고른 뒤에야 말할 수 있는 것들. 자리를 미리 비워 두면 버튼이 위아래로 튄다. */}
      <p className="mt-4 min-h-[1.25rem] text-[13px] text-[#60655c]" role="status">
        {selectedRouteId === null
          ? ''
          : isDetailPending
            ? '동선을 확인하는 중이에요...'
            : isDetailError
              ? '동선 내용을 불러오지 못했어요. 다시 골라주세요.'
              : `기록 ${treeCount}개로 초안을 만들어요.`}
      </p>

      <button
        type="button"
        className="mt-auto h-[54px] w-full rounded-xl bg-pictree-700 text-[16px] font-medium text-white shadow-[0_7px_14px_rgba(45,51,34,0.13)] disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onNext}
        disabled={!canGoNext}
      >
        다음
      </button>
    </div>
  );
}
