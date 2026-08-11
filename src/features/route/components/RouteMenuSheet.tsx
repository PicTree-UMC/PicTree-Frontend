import { type ReactNode } from 'react';
import { Sheet, TrashIcon } from '@/shared/components';
import { Route } from '../types/route';

interface RouteMenuSheetProps {
  route: Route;
  onClose: () => void;
  onAIBlog: () => void;
  onRename: () => void;
  /**
   * 삭제 확인 모달을 연다. **시트가 직접 지우지 않는다** — 되돌릴 수 없는 동작은
   * 공용 `DeleteConfirmModal` 이 한 번 더 묻는다.
   */
  onDelete: () => void;
}

const iconBase = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** AI 블로그 작성(solar:book-linear) */
function BookIcon({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M6 3h13a1 1 0 0 1 1 1v14H7a3 3 0 0 0-3 3V6a3 3 0 0 1 3-3Z" />
      <path d="M4 18a3 3 0 0 0 3 3h13" />
    </svg>
  );
}

/** 이름 변경(lucide:pen-line) */
function PenIcon({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

/** 줄 오른쪽 꺾쇠. 기하·굵기·색은 `SettingsRow` 의 것과 같은 값이다. */
function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px] shrink-0 text-ink-disabled"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/**
 * 아이콘 상자 40px + 아이콘과 글자 사이 14px. 줄 사이 구분선을 **글자 시작점에** 맞추는 데 쓴다
 * (`SettingsList` 와 같은 규칙) — 줄 폭을 다 가로지르면 목록이 아니라 칸으로 쪼개져 보인다.
 */
const TEXT_INSET_PX = 40 + 14;

/** 줄 사이 옅은 헤어라인. 글자 시작점까지 들여쓴다. */
function Divider() {
  return <div aria-hidden className="h-px bg-line-soft" style={{ marginLeft: TEXT_INSET_PX }} />;
}

interface MenuRowProps {
  icon: ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  /**
   * 되돌릴 수 없는 동작(삭제). ERROR 로 물들이고 **꺾쇠를 안 그린다** — 꺾쇠는 '어디로 간다'는
   * 뜻이고, 이 줄은 그 자리에서 확인을 묻는다(`SettingsRow` 의 `action` 과 같은 기준).
   */
  danger?: boolean;
}

/**
 * 시트의 동작 한 줄. **아이콘 타일 + 제목 + 설명 + 꺾쇠**.
 *
 * 예전에는 맨몸 선 아이콘(30px) 옆에 글자 두 줄이 놓인 것이 전부였다. 눌러도 되는 자리라는
 * 신호가 하나도 없어서(면·구분선·꺾쇠·눌림 반응 전부 없음) 시트가 동작 목록이 아니라 안내문
 * 처럼 읽혔다. 타일이 아이콘에 무게를 주고, 꺾쇠가 이 줄이 어디로 데려간다고 말한다.
 *
 * 높이는 아이콘 타일(40) + 위아래 12 = 64px. 권장 터치 영역(44)을 넉넉히 넘긴다.
 */
function MenuRow({ icon, title, desc, onClick, danger = false }: MenuRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      // 흰 바닥이라 눌림은 크림 서브(#F6F0D7)로 준다 — 위험한 줄만 ERROR 면으로.
      className={`flex w-full items-center gap-3.5 py-3 text-left ${
        danger ? 'active:bg-error-surface' : 'active:bg-cream-sub'
      }`}
    >
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-[12px] ${
          danger ? 'bg-error-surface text-error' : 'bg-pictree-100 text-pictree-700'
        }`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] font-medium ${danger ? 'text-error' : 'text-ink'}`}>
          {title}
        </span>
        {/* 11px 이었다 — 최소 13px(§2)에 미달이고, 흰 바닥에서 INK 로 두면 제목과 무게가
            비슷해 두 줄이 한 덩어리로 뭉쳐 보였다. 보조 문구 자리이므로 INK-muted. */}
        <span className="block truncate text-[13px] text-ink-muted">{desc}</span>
      </span>

      {!danger && <ChevronIcon />}
    </button>
  );
}

/**
 * 동선 하나에 걸 수 있는 동작을 모은 시트 — `/journey` 목록의 더보기(⋯)로 연다.
 *
 * **동선에 거는 동작은 전부 여기 있다.** 삭제만 페이지 상단의 빨간 휴지통 아이콘으로 따로
 * 서 있었는데, 그러면 나머지는 시트를 열어야 보이고 하나는 목록 옆에 상시로 떠 있어서
 * **가장 위험한 것이 가장 누르기 쉬운 자리**를 차지한 셈이었다. 지금은 시트 맨 아래,
 * 구분선 아래 ERROR 줄이다(iOS 액션시트와 같은 자리).
 *
 * ⚠️ 반대로 **`지도에서 보기` 와 `사진 앨범` 은 여기서 나갔다.** 둘 다 동선에 무언가를
 * 하는 동작이 아니라 **같은 동선을 다르게 보여주는 일**이라 메뉴에 있을 이유가 없었다 —
 * 지도는 로드맵과 나란히 고르는 피커로(`RouteViewPicker`), 사진은 그 아래 앨범 섹션으로
 * (`RoutePhotoAlbum`) 화면에 상시로 나와 있다. **여기 남은 것은 동선을 바꾸거나 없애는
 * 것들뿐이다.**
 *
 * 겉모습은 **동선 만들기 ②의 시트(`RoutePlaceStrip`)를 따른다** — 흰 바닥,
 * `rounded-t-[20px]`, 위로 뜨는 그림자, 40×4px 회색 그립. 크림 바닥이었던 이유는 없다:
 * 시트의 역할색은 흰색(#FFFFFF)이고 크림·연초록은 **패널의 색이지 시트의 색이 아니다**
 * (그쪽 주석에 근거가 적혀 있다).
 *
 * ⚠️ 딤은 남긴다. `RoutePlaceStrip` 이 딤을 안 까는 건 뒤가 지도라서다. 여기 뒤는 크림
 * 페이지라, 딤이 없으면 흰 시트가 페이지의 일부인지 위에 뜬 것인지 구분되지 않는다.
 *
 * **머리는 이름 + 메타 한 줄뿐이다.** 제목 아래에 이모지·점선으로 잇는 미니 동선
 * (`PlaceTrail`)이 있었는데, ⓐ 딤 뒤의 로드맵(`SavedRouteRoadmap`)이 이미 같은 말을 하고
 * ⓑ 장소가 다섯 곳을 넘으면 칸이 좁아져 이름이 전부 뭉개졌다. 어느 동선인지는 이름이 말한다.
 * (그 컴포넌트는 다른 사용처가 없어져 함께 지웠다.)
 */
export function RouteMenuSheet({
  route,
  onClose,
  onAIBlog,
  onRename,
  onDelete,
}: RouteMenuSheetProps) {
  return (
    <Sheet
      onClose={onClose}
      label={`${route.title} 옵션`}
      dim="dark"
      handleColor="#D9D9D9"
      handleSize="grip"
      className="rounded-t-[20px] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
      contentClassName="px-5"
      bottomPadding="1.25rem"
    >
      {/* 머리: 어느 동선에 거는 동작인지. 20px bold 였다 — bold 는 쓰지 않고(§2), 시트 제목
          자리는 17px medium 이다. 날짜와 장소 수는 한 줄로 묶어 보조 문구로 내린다. */}
      <div className="pt-1">
        <h2 className="truncate text-[17px] font-medium text-ink">{route.title}</h2>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          {route.date} · {route.placeCount}개 장소
        </p>
      </div>

      {/* 동작 묶음. 구분선은 글자 시작점에 맞춰 들여쓴다. */}
      <div className="mt-4 flex flex-col">
        <MenuRow
          icon={<BookIcon className="size-[22px]" />}
          title="AI 블로그 작성"
          desc="이 동선으로 여행 블로그를 생성해요"
          onClick={onAIBlog}
        />
        <Divider />
        <MenuRow
          icon={<PenIcon className="size-[22px]" />}
          title="이름 변경"
          desc="동선의 이름을 수정해요"
          onClick={onRename}
        />
      </div>

      {/* 삭제만 묶음 밖이다. 구분선을 **들여쓰지 않아** 위와 다른 무게로 읽힌다
          (`SettingsList` 가 가운데 정렬 동작 줄에 쓰는 것과 같은 처리). */}
      <div className="mt-1 border-t border-line-soft pt-1">
        <MenuRow
          icon={<TrashIcon className="size-[22px]" strokeWidth={1.7} />}
          title="동선 삭제"
          desc="삭제하면 되돌릴 수 없어요"
          onClick={onDelete}
          danger
        />
      </div>
    </Sheet>
  );
}
