import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRoutePlaceCandidates } from './hooks/useRoutePlaceCandidates';
import { RouteCalendar } from './components/RouteCalendar';
import { RoutePlacePreview } from './components/RoutePlacePreview';
import { formatDateLabel } from './lib/formatDate';
import {
  DATES_PARAM,
  MAX_DATES,
  MAX_PLACES,
  parseDatesParam,
  toDatesParam,
} from './lib/routeParams';
import { Chip, NavBar } from '@/shared/components';
import { useGoBack } from '@/shared/hooks/useGoBack';
import { ROUTES } from '@/shared/constants/routes';

/** 날짜 칩의 해제 표시. 칩 전체가 버튼이라 이건 그림일 뿐이다. */
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * 새 동선 만들기 ①단계 — 날짜 고르기(화면설계서 1·3·4번).
 *
 * **지도 화면에서 떼어낸 화면이다.** 예전에는 지도 위에 캘린더 시트를 얹었는데, 시트가
 * 화면 대부분을 덮어 사실상 화면 전환이면서 뒤로가기·새로고침으로는 되돌아갈 수 없었다.
 * 게다가 진입 직후에는 지도에 그릴 동선이 없어서 '빈 지도 + 알약 하나'가 첫인상이었다.
 * 날짜를 고르는 동안 지도는 보여줄 게 없으므로 이 단계는 캘린더가 화면 전체를 갖는다.
 *
 * 고른 날짜는 `?dates=` 에 실어 ②단계(`/journey/view`)로 넘긴다. 거기서 뒤로 오면 같은
 * 쿼리를 달고 이 화면이 다시 뜨므로 선택이 그대로 살아난다.
 */
export function RouteCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 이 화면의 부모는 동선 탭이다. 보통은 `-1` 이라 안 쓰이고, 링크로 바로 들어왔을 때만 쓰인다.
  const goBack = useGoBack(ROUTES.journey);

  const { data, isLoading, isError, isPaused, refetch } = useRoutePlaceCandidates(true);
  const candidates = useMemo(() => data ?? [], [data]);

  /**
   * 네트워크가 끊겨 요청이 멈춘 상태. **로딩도 에러도 아니다** — react-query 는 오프라인이면
   * 재시도를 미뤄두고 `fetchStatus:'paused'` 로 앉아 있으므로, 따로 안 그리면 화면이
   * '날짜가 하나도 없는 빈 달력'으로 굳는다. 연결이 돌아오면 알아서 이어서 받는다.
   */
  const isOffline = isPaused && data === undefined;

  // ②단계에서 뒤로 왔을 때를 위해 쿼리에서 초기값을 읽는다. 이후 토글은 로컬 상태만 고치고
  // URL 은 '다음'을 누를 때 한 번 쓴다 — 한 칸 누를 때마다 히스토리가 쌓이면 뒤로가기가 망가진다.
  const [pickedDates, setPickedDates] = useState(() =>
    parseDatesParam(searchParams.get(DATES_PARAM)),
  );

  /**
   * 한도에 막힌 횟수. 값 자체는 안 보이고 **칩 줄의 `key`** 로만 쓴다 — 같은 key 로 두면 DOM 이
   * 그대로라 연달아 눌렀을 때 흔들림이 다시 재생되지 않는다.
   */
  const [limitAttempt, setLimitAttempt] = useState(0);

  // 흔들림이 끝나면 0 으로 돌려놓는다. 안 돌려놓으면 다음에 날짜를 지웠다 고를 때 key 가
  // 그대로라 같은 문제가 되돌아온다(애니메이션 420ms 보다 넉넉히 뒤).
  useEffect(() => {
    if (limitAttempt === 0) return;
    const timer = window.setTimeout(() => setLimitAttempt(0), 1000);
    return () => window.clearTimeout(timer);
  }, [limitAttempt]);

  // 캘린더가 '방문한 날짜 + 그날 장소 수'를 요구한다(설계서 1번).
  const placeCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    candidates.forEach((place) => counts.set(place.date, (counts.get(place.date) ?? 0) + 1));
    return counts;
  }, [candidates]);

  /** 고른 날짜에 딸려 오는 장소들. 방문 순서(후보 목록 순서)를 그대로 둔다. */
  const pickedPlaces = useMemo(
    () => candidates.filter((place) => pickedDates.includes(place.date)),
    [candidates, pickedDates],
  );

  const toggleDate = (dateKey: string) => {
    // 한도(3일)에 막히면 고른 날짜 칩 줄을 흔든다 — 문구 없이도 '이게 꽉 찼다' 가 읽힌다.
    if (!pickedDates.includes(dateKey) && pickedDates.length >= MAX_DATES) {
      setLimitAttempt((attempt) => attempt + 1);
      // 흔들림만으로는 손가락에 가려 놓칠 수 있다. iOS 사파리는 이 API 가 없어 조용히 넘어간다.
      navigator.vibrate?.(20);
      return;
    }

    setLimitAttempt(0);
    setPickedDates((current) =>
      current.includes(dateKey)
        ? current.filter((date) => date !== dateKey)
        : [...current, dateKey].sort(),
    );
  };

  const goToMap = () => {
    if (pickedDates.length === 0) return;
    navigate(`${ROUTES.journeyView}?${DATES_PARAM}=${toDatesParam(pickedDates)}`);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#FFFCEF]">
      {/* 상단 여백은 pt-header 하나로 — 스텝 2(지도)와 같은 값이라 넘어갈 때 뒤로가기가 안 튄다. */}
      <header className="px-5 pt-header">
        <NavBar onBack={goBack} title="날짜 선택" />
      </header>

      {/*
        고른 날짜를 칩으로 늘어놓는다. 달력에서 다시 찾아 누르지 않고 여기서 바로 뺄 수 있고,
        달을 넘겨 다른 달을 보고 있어도 지금 뭘 골랐는지가 남는다.

        한도에 막히면 이 줄이 통째로 흔들린다 — 새로 뜨는 문구는 등장 자체가 움직임이라
        흔들려도 눈에 안 들어온다. **꽉 찬 그것**이 흔들려야 왜 안 눌렸는지가 바로 읽힌다.
        key 로 다시 마운트시켜야 연달아 눌렀을 때도 매번 재생된다.
      */}
      <div
        key={limitAttempt}
        className={`flex items-center gap-2 px-5 pt-4 ${
          limitAttempt > 0 ? 'motion-safe:animate-shake' : ''
        }`}
      >
        <div className="flex min-h-[40px] w-full items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {/* `selected` 를 안 넘긴다 — 누르면 켜졌다 꺼지는 토글이 아니라 **빼는 동작**이고,
              고른 날짜만 여기 있으니 '골랐음'을 색으로 또 말할 이유도 없다. Chip 은
              `selected` 가 없으면 `aria-pressed` 도 안 붙인다. */}
          {pickedDates.map((date) => (
            <Chip
              key={date}
              onClick={() => toggleDate(date)}
              aria-label={`${formatDateLabel(date)} 선택 해제`}
              trailing={<CloseIcon className="h-4 w-4 text-[#60655c]" />}
              className="pr-2.5"
            >
              {formatDateLabel(date)}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto px-5">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-[#89986d]" />
            <p className="text-[15px] font-medium text-[#5c6f2b]">방문한 날짜를 불러오는 중...</p>
          </div>
        ) : isError || isOffline ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-3">
            <p className="text-center text-[15px] font-medium text-[#2c3930]">
              {isOffline ? '네트워크에 연결되어 있지 않아요' : '방문한 날짜를 불러오지 못했어요'}
            </p>
            <button
              onClick={() => refetch()}
              className="h-[46px] rounded-[24px] bg-pictree-700 px-8 text-[15px] font-medium text-white"
            >
              다시 시도
            </button>
          </div>
        ) : placeCountByDate.size === 0 ? (
          <p className="mt-10 text-center text-[15px] leading-6 text-[#60655c]">
            아직 방문한 장소가 없어요.
            <br />
            사진을 남기면 그날이 달력에 표시돼요.
          </p>
        ) : (
          <RouteCalendar
            placeCountByDate={placeCountByDate}
            selectedDates={pickedDates}
            onSelect={toggleDate}
          />
        )}
      </div>

      {/* 미리보기와 CTA 는 아래에 고정한다 — 달력을 넘기는 동안에도 '지금 뭘 골랐는지' 가
          화면 밖으로 밀려나지 않는다. */}
      <div className="border-t border-[#2c3930]/10 px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
        <RoutePlacePreview
          places={pickedPlaces}
          onClear={() => {
            setLimitAttempt(0);
            setPickedDates([]);
          }}
        />

        {/* 장소 한도는 여기서 막지 않는다 — 다음 화면에서 장소를 꺼서 줄일 수 있기 때문에
            길을 막는 대신 미리 알려만 준다(저장 시점에 다시 검사한다). */}
        {pickedPlaces.length > MAX_PLACES && (
          <p className="mt-2 text-[13px] text-[#dc2626]">
            장소가 {MAX_PLACES}개를 넘었어요. 다음 화면에서 뺄 수 있어요
          </p>
        )}

        <button
          type="button"
          onClick={goToMap}
          disabled={pickedDates.length === 0}
          className="mt-3 h-[52px] w-full rounded-[24px] bg-pictree-700 text-[15px] font-medium text-white disabled:bg-[#b4b4b4]"
        >
          {pickedDates.length === 0 ? '날짜를 선택해주세요' : '다음'}
        </button>
      </div>
    </div>
  );
}
