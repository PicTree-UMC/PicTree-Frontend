import { useNavigate } from "react-router-dom";
import { CalendarGrid } from "@/shared/components";
import { ROUTES } from "@/shared/constants/routes";
import { useTravelCalendar } from "../hooks/useTravelCalendar";
import { CALENDAR_LEVEL_COLORS } from "../lib/calendarLevel";
import { PreviewCard } from "./PreviewCard";

/**
 * 메인 탭의 여행 캘린더 미리보기 — **이번 달 잔디만** 보여준다.
 *
 * 달을 넘기는 화살표(`CalendarMonthNav`)를 안 단다. 넘길 수 있게 두면 이 카드가 곧
 * 캘린더 화면이 되어 버려서 아래 '전체 보기' 가 할 일이 없어지고, 카드 안에 버튼이
 * 생겨 껍데기(`PreviewCard`)를 통째로 누르는 구조도 깨진다. 여기서는 **지금 이 달이
 * 어떻게 채워지고 있나** 하나만 답한다.
 *
 * 격자도 읽기 전용이다 — `onDateSelect` 를 안 넘기면 `CalendarGrid` 가 칸을 `div` 로
 * 그린다(그 컴포넌트가 이미 갈래를 갖고 있다). 날짜별 나무 목록은 전체 화면의 몫이다.
 *
 * 요청은 `GET /calendar?year=&month=` **1회**다. 같은 훅을 전체 화면도 쓰고 queryKey 에
 * 연·월이 들어 있어, 미리보기를 보고 '전체 보기' 로 들어가면 이번 달은 캐시로 뜬다.
 */
export function CalendarPreview() {
  const navigate = useNavigate();

  /*
    '이번 달' 은 렌더 때 읽는다. 자정을 넘겨 날짜가 바뀌어도 다시 그려지기 전까지는
    어제의 달을 들고 있는데, 달이 바뀌는 자정은 한 해에 열두 번뿐이고 그 순간 화면을
    열어 둔 채 있을 이유도 거의 없다 — 타이머를 두는 값이 아니다.
  */
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { levelByDate, isPending, isError } = useTravelCalendar(year, month);

  // 잔디가 깔린 날 수. `levelByDate` 는 level 0(기록 없음)을 아예 안 담는다.
  const markedDays = Object.keys(levelByDate).length;

  return (
    <PreviewCard
      title="여행 캘린더"
      meta={`${year}년 ${month}월`}
      ariaLabel="여행 캘린더 전체 보기"
      onClick={() => navigate(ROUTES.calendar)}
    >
      {isError ? (
        /*
          재시도 버튼을 안 둔다 — 껍데기가 버튼이라 안에 또 버튼을 넣을 수 없고,
          이 카드는 미리보기라 여기서 되살릴 만큼 중요하지도 않다. 눌러서 전체 화면으로
          가면 거기 재시도가 있다.
        */
        <p className="py-6 text-center text-[13px] text-[#60655C]">
          잔디를 불러오지 못했어요. 눌러서 전체 화면에서 다시 시도해 보세요.
        </p>
      ) : (
        <>
          <div className={isPending ? "opacity-50 transition-opacity" : undefined}>
            <CalendarGrid
              year={year}
              month={month}
              levelByDate={levelByDate}
              levelColors={CALENDAR_LEVEL_COLORS}
            />
          </div>

          {/*
            격자만 두면 잔디가 옅은 날은 눈에 안 걸려 "이번 달은 비었나" 로 읽힌다.
            한 줄로 세어 준다. 색 단계의 뜻은 전체 화면의 `i` 시트가 맡는다.
          */}
          <p className="mt-2 text-[13px] text-[#60655C]">
            {isPending
              ? "잔디를 불러오는 중..."
              : markedDays > 0
                ? `이번 달 ${markedDays}일에 나무를 심었어요`
                : "이번 달은 아직 심은 나무가 없어요"}
          </p>
        </>
      )}
    </PreviewCard>
  );
}
