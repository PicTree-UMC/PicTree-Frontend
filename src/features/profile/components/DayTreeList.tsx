import { Photo } from '@/shared/components';

import type { CalendarTree } from '../api/calendarTreesApi';

/** 카드 안쪽 가로 패딩(16) + 썸네일(44) + 사이 간격(12). 구분선을 이름 시작점에 맞춘다. */
const TEXT_INSET_PX = 16 + 44 + 12;

interface DayTreeListProps {
  /** `YYYY-MM-DD`. 카드 위 제목에 쓴다. */
  date: string;
  trees: CalendarTree[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

/** '2026-08-15' → '8월 15일 (금)'. 요일까지 붙이는 건 캘린더에서 눌러 온 맥락이라서다. */
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDayTitle(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return `${parsed.getMonth() + 1}월 ${parsed.getDate()}일 (${WEEKDAYS[parsed.getDay()]})`;
}

/**
 * 캘린더에서 누른 날짜에 심은 나무들 — iOS 설정의 그룹 리스트 꼴.
 *
 * ⚠️ **공용 `SettingsList`/`SettingsRow` 를 쓰지 않는다.** 그쪽의 `image` 는 흰 카드에
 * 그대로 얹는 34px **아이콘** 자리이고(주석에 명시), 부제도 일부러 막아 뒀다 — 줄마다
 * 두 줄짜리 설명이 붙으면 카드가 목록처럼 읽힌다는 이유다. 여기 줄은 정확히 그 목록이라
 * 사진 썸네일 + 한줄평이 필요하다. 대신 **카드 껍데기는 같은 규칙**을 지킨다:
 * 1px `border-line-soft` 헤어라인, `rounded-xl`, 구분선은 글자 시작점(72px)에 맞춰 들여쓴다.
 */
export function DayTreeList({ date, trees, isPending, isError, onRetry }: DayTreeListProps) {
  return (
    <section className="mt-6">
      {/* 개수(`나무 n그루`)는 오른쪽에 붙였다가 뺐다 — 줄이 곧 나무 하나라 세면 바로 나오고,
          목록 위에 숫자를 또 두면 제목이 두 갈래로 읽힌다. */}
      <h2 className="mb-2 px-1 text-[17px] font-medium text-[#2c3930]">{formatDayTitle(date)}</h2>

      {isPending ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line-soft bg-white py-10">
          <div className="size-8 animate-spin rounded-full border-[3px] border-pictree-300 border-t-pictree-500" />
          <p className="text-[15px] text-[#60655C]">나무를 불러오는 중...</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-line-soft bg-white py-8">
          <p className="text-[15px] font-medium text-[#2c3930]">나무를 불러오지 못했어요</p>
          <button
            type="button"
            onClick={onRetry}
            className="h-[46px] rounded-[24px] bg-pictree-700 px-8 text-[15px] font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      ) : trees.length === 0 ? (
        /*
          잔디가 깔린 날인데 목록이 비었다면 서버의 `/calendar` 집계와 `/trees` 목록이
          어긋난 것이다. 그래도 화면은 말이 되게 둔다 — 빈 카드를 그리는 것보다 낫다.
        */
        <p className="rounded-xl border border-line-soft bg-white py-8 text-center text-[15px] text-[#60655C]">
          이 날 심은 나무가 없어요
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
          {trees.map((tree, index) => (
            <div key={tree.treeId}>
              {index > 0 && (
                <div aria-hidden className="h-px bg-line-soft" style={{ marginLeft: TEXT_INSET_PX }} />
              )}

              <div className="flex items-center gap-3 px-4 py-3">
                {/* 사진이 없거나 못 불러오면 회색 자리로 둔다 — 즐겨찾기 목록과 같은 처리다. */}
                <Photo
                  src={tree.imageUrl}
                  className="size-11 shrink-0 rounded-lg object-cover"
                  fallback={<span className="size-11 shrink-0 rounded-lg bg-line" />}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-[#2c3930]">
                    {/* 기분 이모지는 이름 앞에 붙인다 — 한 줄을 더 쓰지 않으면서 눈에 걸린다. */}
                    {tree.mood && <span className="mr-1">{tree.mood}</span>}
                    {tree.name}
                  </p>
                  {tree.description && (
                    <p className="mt-0.5 truncate text-[13px] text-[#60655C]">{tree.description}</p>
                  )}
                </div>

                <span className="shrink-0 text-[13px] text-[#60655C]">{tree.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
