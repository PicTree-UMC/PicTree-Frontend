import type { ReactNode } from 'react';
import { BackButton } from './BackButton';

interface NavBarProps {
  /** 뒤로가기를 눌렀을 때. `leading` 을 주면 안 쓰인다. */
  onBack?: () => void;
  /** 기본값 '뒤로 가기'. 어디로 가는지가 분명치 않은 화면만 따로 준다. */
  backLabel?: string;
  /**
   * 뒤로가기 자리를 통째로 갈아끼울 때만(예: 선택 모드의 ×).
   * **40px 짜리를 넣을 것** — 이 자리 폭이 달라지면 모드가 바뀔 때 헤더가 흔들린다.
   */
  leading?: ReactNode;
  title?: ReactNode;
  /** 오른쪽 끝 액션(삭제, 전체 선택, 날짜 등). 폭은 자유 — 제목 위치에 영향을 주지 않는다. */
  action?: ReactNode;
  /**
   * 지도 위에 얹는 헤더일 때. 제목에 흰 외곽선을 둘러 지도 라벨·지형 위에서도 읽히게 한다.
   * 알약 배경을 깔지 않는 이유는 `.text-halo` 주석 참고.
   */
  titleOnMap?: boolean;
  className?: string;
}

/**
 * 화면 상단의 내비게이션 줄 — 왼쪽 뒤로가기 + **가운데 제목** + 오른쪽 액션(선택).
 *
 * 바깥 `<header>` 는 화면 몫이다. 초록 밴드·sticky·safe-area 여백·아래에 붙는 부가 행(연도
 * 피커, 단계 표시줄 등)이 화면마다 다르기 때문에, 이 컴포넌트는 **줄 하나만** 그린다.
 * 가로 패딩도 부모가 준다(`px-5` 기준 — `BackButton` 원의 왼쪽 끝이 거기 맞는다).
 *
 * 제목을 `absolute` 로 가운데 박는 이유: `flex-1 text-center` 로는 좌우 슬롯 폭이 같을 때만
 * 가운데가 맞는다. 오른쪽 액션은 '삭제 아이콘'부터 '전체 선택' 글자까지 폭이 제각각이라
 * 그 방식으로는 제목이 화면마다 조금씩 밀린다. 여기서는 **오른쪽에 뭐가 오든 제목은 화면
 * 정가운데**다. 긴 제목이 버튼을 덮지 않게 폭을 60% 로 묶고 넘치면 자른다.
 */
export function NavBar({
  onBack,
  backLabel,
  leading,
  title,
  action,
  titleOnMap = false,
  className = '',
}: NavBarProps) {
  return (
    <div className={`relative flex items-center ${className}`}>
      {leading ?? (onBack && <BackButton onClick={onBack} aria-label={backLabel} />)}

      {title && (
        // pointer-events-none: 가운데 제목이 줄 전체를 가로지르므로, 켜 두면 오른쪽
        // 액션의 터치를 가로챌 수 있다. 제목은 누를 것이 아니라 읽는 것이다.
        <h1
          className={`pointer-events-none absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-center text-[18px] font-medium text-[#2c3930] ${
            titleOnMap ? 'text-halo' : ''
          }`}
        >
          {title}
        </h1>
      )}

      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}
