import type { ReactNode } from 'react';
import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';

import { TrashIcon } from './TrashIcon';

type DeleteIconButtonProps = {
  label: string;
  onClick: () => void;
  className?: string;
};

export function DeleteIconButton({ label, onClick, className = '' }: DeleteIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      // 글자는 토큰(`text-error`)인데 눌림 배경만 Tailwind 기본 연빨강(#FEF2F2)이었다 — canonical 은
      // `error-surface`(#FEF7F7)다. 한 클래스 안에서 토큰과 팔레트 이름이 섞여 있던 자리다.
      className={`grid size-10 shrink-0 place-items-center rounded-full text-error active:bg-error-surface ${className}`}
    >
      <TrashIcon className="h-[21px] w-[21px]" />
    </button>
  );
}

type DeleteConfirmModalProps = {
  isOpen: boolean;
  title: string;
  /** 제목 아래 설명. 여러 줄이 필요하면 조각(fragment)으로 넘긴다. */
  description?: ReactNode;
  /** 파괴 버튼 글자. 지우는 게 아니면 바꾼다(예: '제거', '탈퇴'). */
  confirmLabel?: string;
  /** 처리 중일 때의 파괴 버튼 글자. */
  pendingLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
};

/**
 * 되돌릴 수 없는 동작을 확인받는 공용 모달. 앱의 파괴적 확인은 전부 이걸 쓴다 —
 * 모으기 전엔 삭제/제거/탈퇴 확인이 여섯 벌이었고 카드 폭·버튼 높이·글자 크기가 다 달랐다.
 *
 * 생김새는 iOS 기본 알럿을 따른다:
 * - **휴지통 아이콘을 얹지 않는다.** 제목이 "…삭제할까요?" 라 아이콘이 같은 말을 두 번 하고,
 *   빨간 그림이 화면에서 제일 먼저 읽혀 정작 무엇이 사라지는지가 뒤로 밀린다.
 * - 버튼은 가로 두 칸이 아니라 **헤어라인으로 나뉜 세로 스택**이고, 파괴 동작이 위·취소가 아래다.
 *   가로 배치는 두 버튼이 같은 무게로 보여 "어느 쪽이 무서운 쪽인지"를 색 하나로만 구분했다.
 * - 취소는 면을 깔지 않는다. 채워진 회색 버튼이 옆의 빨간 버튼과 크기가 같아 짝처럼 보였다.
 *
 * 바닥은 흰색이다 — 크림(`#FFFCEF`)은 페이지 배경 값이고, 그 위에 뜨는 면은 흰색이 정본(§1.3).
 */
export function DeleteConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = '삭제',
  pendingLabel = '삭제 중',
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  // 같은 화면에 두 개가 뜰 수 있어 id 를 고정 문자열로 두지 않는다.
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isDeleting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return createPortal(
    // 스토리 뷰어(z-50) 위에서도 열리므로 z-[60]. 컬럼 정렬은 §4 대로 모달도 셸과 맞춘다.
    <div
      className="animate-fade-in fixed inset-0 z-[60] mx-auto flex items-center justify-center bg-black/40 px-8 sm:max-w-[390px]"
      role="presentation"
      onClick={isDeleting ? undefined : onClose}
    >
      <section
        className="w-full max-w-[300px] overflow-hidden rounded-[14px] bg-white text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pb-5 pt-6">
          {/*
            17px 은 §2 의 기본 두 값(13/15)이 아니라 시안 근거로 쓰는 크기다 — 레퍼런스 알럿의
            제목이 이 크기고, 앱의 다른 헤드라인(빈 화면 문구들)도 이미 17px 이다.
            굵기는 예외 없이 medium 이다: 크기 차이만으로 설명과 위계가 갈린다.
          */}
          <h2 id={titleId} className="text-[17px] font-medium leading-[24px] text-ink">
            {title}
          </h2>
          {description && (
            // 설명은 §2 의 본문 값인 15px 이다. 레퍼런스 알럿은 13px 이지만 그대로 가져오니
            // 작아서, 무엇이 사라지는지를 말하는 줄로는 읽히지 않았다.
            // 감싸개가 `p` 가 아니라 `div` 인 건, 탈퇴 확인처럼 설명 안에 강조 블록을 넣는
            // 자리가 있어서다 — `p` 안에 블록 요소를 넣으면 브라우저가 문단을 끊어 버린다.
            <div id={descriptionId} className="mt-2 text-[15px] leading-[22px] text-ink-muted">
              {description}
            </div>
          )}
        </div>

        <div className="border-t border-line-soft">
          <button
            type="button"
            className="h-[50px] w-full text-[15px] font-medium text-error active:bg-line-soft disabled:opacity-50"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? pendingLabel : confirmLabel}
          </button>
          <button
            type="button"
            className="h-[50px] w-full border-t border-line-soft text-[15px] font-medium text-ink active:bg-line-soft disabled:opacity-50"
            onClick={onClose}
            disabled={isDeleting}
          >
            취소
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
