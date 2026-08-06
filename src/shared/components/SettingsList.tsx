import { Children, Fragment, isValidElement, type CSSProperties, type ReactNode } from 'react';

/**
 * 카드 안쪽 가로 패딩(px-4) + 아이콘 타일(30) + 사이 간격(gap-3).
 * 구분선을 글자 시작점에 맞추는 데 쓴다.
 */
const TEXT_INSET_PX = 16 + 30 + 12;

interface SettingsRowProps {
  /**
   * 아이콘 SVG 의 URL. 색을 GREEN-500 타일 위 흰 글리프로 통일해야 해서 `<img>` 가 아니라
   * **CSS 마스크**로 그린다 — 에셋들이 `fill="black"`·`fill="#FF4B4B"` 처럼 색을 박아 두고
   * 있어서 `<img>` 로는 다시 칠할 수 없다.
   */
  icon?: string;
  title: string;
  /** 오른쪽 끝 회색 값 (`iCloud 50GB` 꼴). 화살표 앞에 붙는다. */
  value?: ReactNode;
  /** 오른쪽 끝 커스텀 슬롯(토글 등). 주면 화살표를 그리지 않는다. */
  trailing?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /**
   * 어디로 이동하는 줄이 아니라 **그 자리에서 실행되는 동작**(로그아웃·탈퇴 등).
   * 가운데 정렬 + 화살표 없음으로 그리고, 색이 위험도를 말한다.
   *
   * - `danger` — ERROR. 되돌릴 수 있지만 세션이 끊기는 동작(로그아웃).
   * - `quiet` — INK-muted. **되돌릴 수 없어서** 오히려 눈에 덜 걸리게 두는 동작(회원탈퇴).
   *   같은 카드에 나란히 두 개를 빨갛게 두면 동급으로 읽히고 오탭 위험이 생긴다.
   */
  action?: 'danger' | 'quiet';
}

/** 마스크로 그리는 아이콘 글리프. 타일 안에서 흰색으로 칠해진다. */
function maskStyle(icon: string): CSSProperties {
  return {
    maskImage: `url(${icon})`,
    WebkitMaskImage: `url(${icon})`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  };
}

/**
 * 그룹 리스트의 한 줄. `SettingsList` 의 **직속 자식**으로만 쓴다.
 *
 * 높이를 52px 로 잡는 이유: 권장 터치 영역 44px 에 아이콘 타일(30px)이 답답하지 않을 만큼만
 * 얹었다. 부제를 달지 않는 대신 오른쪽 `value` 로 상태를 말한다 — 줄마다 두 줄짜리 설명이
 * 붙으면 카드가 아니라 목록처럼 읽힌다. 줄 하나로 안 되는 안내는 `SettingsFooter` 로 내린다.
 */
export function SettingsRow({
  icon,
  title,
  value,
  trailing,
  onClick,
  disabled,
  action,
}: SettingsRowProps) {
  const showChevron = Boolean(onClick) && !trailing && !action;

  const content = (
    <>
      {icon && (
        // GREEN-500 은 데코 전용(§1.2)이라 텍스트는 못 얹지만, 흰 글리프는 3.6:1 로
        // 비텍스트 대비 기준 3:1 을 넘는다.
        <span
          aria-hidden
          className="grid size-[30px] shrink-0 place-items-center rounded-[8px] bg-[#788F4A]"
        >
          <span className="size-[18px] bg-white" style={maskStyle(icon)} />
        </span>
      )}

      <span
        className={`min-w-0 flex-1 truncate text-[17px] font-medium ${
          action === 'danger'
            ? 'text-center text-[#DC2626]'
            : action === 'quiet'
              ? 'text-center text-[#60655C]'
              : 'text-[#2C3930]'
        }`}
      >
        {title}
      </span>

      {value !== undefined && value !== null && (
        <span className="shrink-0 text-[15px] text-[#60655C]">{value}</span>
      )}

      {trailing}

      {showChevron && (
        // 비활성 회색(§1.1). 꺾쇠 기하는 BackButton 과 같은 24 viewBox 를 쓴다.
        <svg
          viewBox="0 0 24 24"
          className="size-[18px] shrink-0 text-[#B4B4B4]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      )}
    </>
  );

  const className = 'flex w-full min-h-[52px] items-center gap-3 px-4 py-2.5 text-left';

  if (!onClick) return <div className={className}>{content}</div>;

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${className} disabled:opacity-50`}>
      {content}
    </button>
  );
}

/**
 * 흰 카드에 담긴 줄 묶음 — iOS 설정의 그룹 리스트 꼴.
 *
 * **테두리는 1px `#ECECEC` 헤어라인이다.** 크림 페이지 배경(`#FFFCEF`)과 흰 카드는 밝기 차가
 * ΔL* 1.1 밖에 안 나서(iOS 의 회색 배경은 4.4) 배경만으로는 카드가 안 보인다. 종전의 2px
 * GREEN-300 테두리가 이 문제를 색으로 때우고 있었는데, 그러면 카드마다 초록 상자가 도드라져
 * 줄 내용보다 틀이 먼저 읽힌다.
 *
 * 구분선은 **글자 시작점에 맞춰 들여쓴다**(아이콘이 있으면 58px, 없으면 16px). 카드 폭 전체를
 * 가로지르면 줄이 아니라 칸으로 쪼개져 보인다. 그래서 직속 자식이 `SettingsRow` 여야 한다 —
 * 아이콘 유무를 읽어 들여쓰기를 정하기 때문이다.
 */
export function SettingsList({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const rows = Children.toArray(children);

  return (
    <div className={`overflow-hidden rounded-xl border border-[#ECECEC] bg-white ${className}`}>
      {rows.map((row, index) => {
        const props = isValidElement<SettingsRowProps>(row) ? row.props : null;

        // 가운데 정렬 동작 줄(`action`)은 맞출 글자 시작점이 없어 선을 끝까지 긋는다.
        const inset = props?.action ? 0 : props?.icon ? TEXT_INSET_PX : 16;

        return (
          <Fragment key={index}>
            {index > 0 && (
              <div aria-hidden className="h-px bg-[#ECECEC]" style={{ marginLeft: inset }} />
            )}
            {row}
          </Fragment>
        );
      })}
    </div>
  );
}

/**
 * 카드 바로 아래 붙는 설명 문구.
 *
 * 줄 안에 부제로 넣지 않는 이유: 한 줄에 안 들어가는 안내(예: "아이폰은 홈 화면에 추가해야
 * 알림을 받을 수 있다")는 그 줄만의 사정이 아니라 카드 전체의 전제인 경우가 많고, 부제를
 * 허용하면 줄 높이가 카드마다 들쭉날쭉해진다.
 */
export function SettingsFooter({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 px-4 text-[13px] text-[#60655C]">{children}</p>;
}
