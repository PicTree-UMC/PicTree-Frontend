import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useKeyboardOffset } from '@/shared/hooks/useKeyboardOffset';
import { useLockBodyScroll } from '@/shared/hooks/useLockBodyScroll';
import { useSheetDrag } from '@/shared/hooks/useSheetDrag';

const DIM_CLASS = {
  /* 뒤를 어둡게 깔지 않는 시안(지도 위 시트). 투명해도 바깥 탭으로 닫히는 건 같다. */
  none: '',
  light: 'bg-black/50',
  dark: 'bg-black/60',
} as const;

interface SheetProps {
  onClose: () => void;
  children: ReactNode;
  /** `role="dialog"` 의 접근성 이름. */
  label?: string;
  dim?: keyof typeof DIM_CLASS;
  /** 손잡이 표시 + 끌어 닫기. 손잡이가 없으면 끌 수도 없다. */
  handle?: boolean;
  /** 손잡이 색. 배경이 밝은 시트는 진하게, 어두운 시트는 흐리게 쓴다. */
  handleColor?: string;
  /**
   * 손잡이 크기.
   *
   * - `wide` — 134×5px. 이 셸이 생길 때 있던 시트들이 쓰던 값이라 기본값으로 남겨 뒀다.
   * - `grip` — 40×4px. **동선 만들기 ②(`RoutePlaceStrip`)의 손잡이**이고, 시트를 이쪽으로
   *   통일해 가는 중이다. 흰 바닥 시트에서 유일하게 '선'인 요소라 LINE 회색(#d9d9d9)과 짝이다.
   *
   * ⚠️ 기본값을 아직 안 바꾼 이유: 이 셸을 쓰는 시트가 아홉이라, 한꺼번에 뒤집으면 이번
   * 변경과 무관한 화면까지 같이 움직인다. 옮길 때마다 이 값을 `grip` 으로 넘기고, 남는 게
   * 없어지면 그때 기본값을 바꾸고 이 prop 을 지운다.
   */
  handleSize?: 'wide' | 'grip';
  /** 열릴 때 슬라이드업. */
  animateIn?: boolean;
  /**
   * 주면 시트가 **위아래로 늘어난 전체 높이 시트**가 된다(값은 화면 위에서 띄울 거리).
   * 안 주면 내용만큼만 차지하는 보통 시트.
   */
  top?: string;
  /** 시트 바깥틀 — 배경·모서리·최대 높이처럼 화면마다 다른 것. */
  className?: string;
  /** 본문 래퍼 — 가로 여백·스크롤. 세로 아래 여백은 셸이 책임진다(`bottomPadding`). */
  contentClassName?: string;
  /**
   * 딤과 시트의 z-index. 클래스가 아니라 인라인으로 넣는다 —
   * Tailwind 임의값(`z-[60]`)과 기본값(`z-50`)의 우선순위는 CSS 출력 순서에 달려 있어
   * 클래스로 덮어쓰면 조용히 어긋날 수 있다.
   */
  z?: number;
  /**
   * 본문 아래 여백. safe-area 와 `max()` 로 묶여 홈 인디케이터를 피한다.
   * `'0'` 을 주면 셸이 손대지 않는다 — 안쪽 스크롤 영역이 여백을 갖는 전체 높이 시트용.
   */
  bottomPadding?: string;
  /**
   * **입력이 있는 시트에만** 준다. 소프트 키보드가 올라온 높이만큼 시트를 띄워, 방금 포커스한
   * 입력이 키보드 뒤로 들어가지 않게 한다(딤과 배경은 그대로 둔다 — 시트만 움직인다).
   *
   * 기본값을 켜지 않은 이유: 이 셸을 쓰는 시트가 아홉인데 대부분 입력이 없어 키보드가
   * 열릴 일이 없고, `visualViewport` 구독을 전부에 달아 둘 이유가 없다. 위치는 셸의 몫이라
   * (§ 아래 doc) 화면마다 `bottom` 을 다시 계산하는 것보다 여기 프롭 하나가 낫다.
   */
  avoidKeyboard?: boolean;
}

/**
 * 바텀시트 공용 셸.
 *
 * **틀만 갖는다** — 포털 · 딤 · 위치와 폭 · safe-area · 손잡이와 끌어 닫기 ·
 * Esc · 바디 스크롤 잠금. 본문 레이아웃은 화면마다 너무 달라서 가져오지 않는다.
 * 가져오려 들면 prop 이 조건 분기 덩어리가 된다.
 *
 * 이 셸이 생기기 전에는 시트 9개가 딤 농도·폭 캡·safe-area 를 제각각 지키고 있었고,
 * 실제로 셋이 틀려 있었다(폭 캡 누락 1 · `sm:` 누락 2 · safe-area 누락 4).
 * **틀은 여기서만 정한다** — 화면에서 다시 쓰면 또 갈라진다.
 *
 * ⚠️ 폭은 반드시 `sm:max-w-[390px]`. `sm:` 을 빼면 430px 폰에서 좌우가 letterbox 로 뜬다.
 */
export function Sheet({
  onClose,
  children,
  label,
  dim = 'light',
  handle = true,
  handleColor = '#111',
  handleSize = 'wide',
  animateIn = true,
  top,
  className = '',
  contentClassName = '',
  z = 50,
  bottomPadding = '1.25rem',
  avoidKeyboard = false,
}: SheetProps) {
  useLockBodyScroll();
  const { sheetRef, handleProps } = useSheetDrag({ onClose, animateIn });
  const keyboardOffset = useKeyboardOffset();
  const bottom = avoidKeyboard ? keyboardOffset : undefined;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      {/* 딤이 없어도 이 층은 남는다 — 바깥 탭으로 닫는 영역이다. */}
      <div
        style={{ zIndex: z }}
        className={`fixed inset-0 ${DIM_CLASS[dim]} ${
          dim !== 'none' && animateIn ? 'animate-fade-in' : ''
        }`}
        onClick={onClose}
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{ top, bottom, zIndex: z }}
        className={`fixed inset-x-0 bottom-0 mx-auto flex flex-col sm:max-w-[390px] ${
          // 키보드가 튀어 오르지 않고 따라 올라오게. `bottom` 만 다루므로 끌어 닫기(transform)와 안 다툰다.
          avoidKeyboard ? 'transition-[bottom] duration-300 ease-out' : ''
        } ${className}`}
      >
        {handle && (
          // 끌어 내려도 닫히고 탭해도 닫힌다 — 끌 수 없는 입력(키보드·보조기술)에는
          // 탭이 유일한 길이라 <button> 이어야 한다.
          <button
            type="button"
            aria-label="닫기"
            {...handleProps}
            className="flex w-full shrink-0 justify-center pb-2 pt-3"
          >
            <span
              className={`rounded-full ${handleSize === 'grip' ? 'h-1 w-10' : 'h-[5px] w-[134px]'}`}
              style={{ backgroundColor: handleColor }}
              aria-hidden
            />
          </button>
        )}

        <div
          className={`min-h-0 flex-1 ${contentClassName}`}
          style={
            bottomPadding === '0'
              ? undefined
              : { paddingBottom: `max(env(safe-area-inset-bottom), ${bottomPadding})` }
          }
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
