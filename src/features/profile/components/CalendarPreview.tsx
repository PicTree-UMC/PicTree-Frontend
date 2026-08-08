import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import { toCalendarDate } from "@/shared/lib/calendar";
import { useTravelCalendar } from "../hooks/useTravelCalendar";
import {
  CALENDAR_EMPTY_COLOR,
  CALENDAR_LEVEL_MIN_TREES,
  CALENDAR_LEVEL_SOLIDS,
} from "../lib/calendarLevel";
import { PreviewCard } from "./PreviewCard";

/** 잔디 칸 수 — 2행 7열. */
const DAY_COUNT = 14;

/**
 * 메인 탭의 여행 캘린더 미리보기 — **최근 2주 잔디**를 깃허브 커밋 격자 꼴로.
 *
 * ⚠️ **한 달치 달력을 통째로 보여주다 최근 2주로 줄였다.** 그때는 전체 화면과 같은
 * `CalendarGrid` 를 읽기 전용으로 깔았는데, 미리보기가 목적지를 다 보여주면 **들어갈
 * 이유가 없어진다** — '전체 보기' 를 눌러도 방금 본 것이 다시 나온다. 지금 이 카드는
 * "요즘 심고 있나" 하나만 답하고, **언제 · 무엇을** 은 전체 화면(날짜별 나무 목록)의 몫이다.
 *
 * 농도는 여행 캘린더와 **같은 4단계 규칙**(`calendarLevel.ts`)이다 — 색이 갈리면 미리보기와
 * 전체 화면이 같은 날을 다른 진하기로 그린다. 다만 여기서는 알파 없는 원색
 * (`CALENDAR_LEVEL_SOLIDS`)을 쓴다: 0.6 은 **날짜 숫자를 안 묻히게** 하려던 값인데 이
 * 격자에는 숫자가 없고, 흰 카드 위에서 풀면 level 1 이 빈 칸보다 밝아져 순서가 뒤집힌다
 * (자세한 것은 그 파일 주석). 단계의 뜻은 전체 화면의 `i` 시트가 맡는다.
 *
 * **요일 정렬을 안 한다.** 오늘로 끝나는 14일이라 마지막 칸이 항상 오늘이고, 열은 요일과
 * 무관하다(윗줄 = 7~13일 전, 아랫줄 = 최근 7일). 일요일 시작으로 맞추면 열에 뜻이 생기는
 * 대신 이번 주의 남은 날이 빈 칸으로 들어와 **실제로 센 날이 8일까지 줄어든다** — '2주' 가
 * 거짓이 된다. 대신 제목 옆에 기간(`7.27 ~ 8.9`)을 적어 격자의 축을 준다.
 *
 * 요청은 `GET /calendar?year=&month=` **1~2회**다. 창이 달을 넘길 때만 지난달을 한 번 더
 * 받는다(매달 1~13일). 이번 달치는 전체 화면과 queryKey 를 나눠 써서 들어가면 캐시로 뜬다.
 */
export function CalendarPreview() {
  const navigate = useNavigate();

  /*
    '오늘' 은 렌더 때 읽는다. 자정을 넘겨도 다시 그려지기 전까지는 어제 창을 들고 있는데,
    그 순간 화면을 열어 둔 채 있을 일이 거의 없어 타이머를 둘 값이 아니다.
    시각을 0시로 눌러 둔다 — 아래 날짜 더하기가 서머타임 없는 KST 라도 안전하게.
  */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - (DAY_COUNT - 1));

  /** 창의 14일치 `YYYY-MM-DD`. 로컬 기준으로 만든다 — `toISOString` 은 UTC 라 하루 밀린다. */
  const dates = Array.from({ length: DAY_COUNT }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return toCalendarDate(day.getFullYear(), day.getMonth() + 1, day.getDate());
  });

  // 창이 달을 넘기면(매달 1~13일) 지난달 응답이 있어야 윗줄이 채워진다.
  const crossesMonth = start.getMonth() !== today.getMonth();

  const current = useTravelCalendar(today.getFullYear(), today.getMonth() + 1);
  const previous = useTravelCalendar(start.getFullYear(), start.getMonth() + 1, {
    enabled: crossesMonth,
  });

  const levelByDate = { ...previous.levelByDate, ...current.levelByDate };

  // 지난달 쪽은 실제로 받을 때만 상태를 센다 — 꺼 둔 쿼리는 계속 pending 이다.
  const isPending = current.isPending || (crossesMonth && previous.isPending);
  const isError = current.isError || (crossesMonth && previous.isError);

  /*
    ⚠️ **합이 아니라 하한이다** — `/calendar` 가 개수를 안 주고 단계만 준다
    (`CALENDAR_LEVEL_MIN_TREES` 주석). 하루 3그루 이상인 날이 섞이면 실제보다 적게 나온다.
    `days[].count` 가 오면 이 줄만 그 값의 합으로 바뀐다.
  */
  const plantedTrees = dates.reduce(
    (sum, date) => sum + (CALENDAR_LEVEL_MIN_TREES[levelByDate[date] ?? 0] ?? 0),
    0,
  );

  /** `7.27 ~ 8.9` — 제목 줄에 들어가야 해서 점 표기다(`7월 27일 ~ 8월 9일` 은 두 배 길다). */
  const range = `${start.getMonth() + 1}.${start.getDate()} ~ ${today.getMonth() + 1}.${today.getDate()}`;

  return (
    <PreviewCard
      title="여행 캘린더"
      meta={range}
      ariaLabel="여행 캘린더 전체 보기"
      onClick={() => navigate(ROUTES.calendar)}
    >
      {isError ? (
        /*
          재시도 버튼을 안 둔다 — 껍데기가 버튼이라 안에 또 버튼을 넣을 수 없고, 미리보기라
          여기서 되살릴 만큼 중요하지도 않다. 눌러서 전체 화면으로 가면 거기 재시도가 있다.
        */
        <p className="py-6 text-center text-[13px] text-[#60655C]">
          잔디를 불러오지 못했어요. 눌러서 전체 화면에서 다시 시도해 보세요.
        </p>
      ) : (
        <>
          {/*
            칸은 정사각형이고 폭이 남는 만큼 커진다(390px 기준 약 40px). 크기를 고정하지
            않는 이유는 이 카드가 `MainTab` 의 `px-5` 안에 있어 기기 폭을 따라가기 때문이다.

            격자 자체는 `aria-hidden` 이다. 껍데기 버튼의 `aria-label` 이 이미 접근 이름을
            덮어써서 안쪽은 어차피 안 읽히고, 칸 14개가 낱낱이 읽히면 방해만 된다.
          */}
          <div aria-hidden className="grid grid-cols-7 gap-1.5">
            {dates.map((date) => (
              <div
                key={date}
                className={`aspect-square rounded-[7px] ${isPending ? "animate-pulse" : ""}`}
                style={{
                  // 받는 중에는 전부 빈 칸으로 두고 맥동만 준다 — 없는 잔디를 먼저 그리지 않는다.
                  backgroundColor: isPending
                    ? CALENDAR_EMPTY_COLOR
                    : (CALENDAR_LEVEL_SOLIDS[levelByDate[date] ?? 0] ||
                      CALENDAR_EMPTY_COLOR),
                }}
              />
            ))}
          </div>

          {/* 격자만 두면 "몇 칸이 얼마나 진한가" 를 눈으로 세게 된다. 한 줄로 세어 준다. */}
          <p className="mt-2.5 text-[13px] text-[#60655C]">
            {isPending
              ? "잔디를 불러오는 중..."
              : plantedTrees > 0
                ? `최근 2주 동안 ${plantedTrees}개의 나무를 심었어요`
                : "최근 2주 동안 심은 나무가 없어요"}
          </p>
        </>
      )}
    </PreviewCard>
  );
}
