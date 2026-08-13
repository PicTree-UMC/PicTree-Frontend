import { useEffect, useRef, useState } from 'react';
import { Sheet } from '@/shared/components';

interface RenameSheetProps {
  currentTitle: string;
  onClose: () => void;
  onConfirm: (newTitle: string) => void;
}

/** 입력 필드 안 펜 아이콘(디자인 lucide:pen-line). 인라인 SVG. */
function PenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

/**
 * 동선 이름 변경 시트.
 *
 * ⚠️ **종전에는 화면 정중앙 모달이었다.** 소프트 키보드가 올라오면 입력이 그 뒤로 들어갔다
 * (이슈 #303). 중앙 정렬은 키보드가 열려도 위치가 그대로라 `useKeyboardOffset` 을 직접
 * 붙일 자리가 마땅치 않은데, 바텀시트 셸은 `avoidKeyboard` 프롭 하나로 키보드 높이만큼
 * 자기를 띄운다. 입력을 받는 시트가 이 길을 쓰는 선례가 이미 있다(`NicknameEditSheet`).
 *
 * 포털 · 딤 · Esc · 바디 스크롤 잠금 · 끌어 닫기는 전부 셸의 몫이라 여기서 다시 하지 않는다.
 * 열림/닫힘은 부모의 조건부 렌더로 제어(마운트 = 열림).
 */
export function RenameSheet({ currentTitle, onClose, onConfirm }: RenameSheetProps) {
  const [newTitle, setNewTitle] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  // 열자마자 입력 대기 상태로 둔다. `preventScroll` 은 iOS 가 배경을 밀어 올리는
  // 자동 스크롤을 막는다 — 시트를 올리는 건 `avoidKeyboard` 쪽 일이다.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  /*
    ⚠️ **다듬은 값으로 판단하고, 다듬은 값을 보낸다.** 공백만 남긴 채 '변경' 을 누르면
    그대로 요청이 나가서 이름이 빈 카드가 목록에 남았다(이슈 #293). 닉네임 시트
    (`NicknameEditSheet`)·동선 저장(`RouteSavePage`)이 이미 같은 규칙이다.

    길이 상한은 두지 않는다 — 서버 제약이 확인된 바 없고, 목록 카드가 긴 이름을 두 줄로
    흘리도록 짜여 있다(`RouteListPage` 의 카드 주석이 '이름 변경에 maxLength 가 없다' 는
    사실에 기대고 있다). 닉네임 시트에 있는 글자 수 표시가 여기 없는 것도 그래서다.
  */
  const trimmed = newTitle.trim();
  const isEmpty = trimmed.length === 0;

  const handleConfirm = () => {
    if (isEmpty) return;
    onConfirm(trimmed);
  };

  return (
    <Sheet
      onClose={onClose}
      label="동선 이름 변경"
      handleColor="#D9D9D9"
      avoidKeyboard
      className="rounded-t-[20px] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
      contentClassName="px-6"
      bottomPadding="2rem"
    >
      <h2 className="text-[15px] font-medium text-ink">동선 이름</h2>

      <div
        className={`mt-3 flex items-center gap-2 rounded-xl border bg-white px-4 py-3 ${
          isEmpty ? 'border-error' : 'border-line-soft'
        }`}
      >
        <PenIcon className="size-[22px] shrink-0 text-ink-muted" />
        <input
          ref={inputRef}
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleConfirm()}
          aria-label="동선 이름"
          aria-invalid={isEmpty}
          placeholder="이름을 입력해주세요"
          className="min-w-0 flex-1 text-[17px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-ink-disabled"
        />
      </div>

      {/*
        안내 자리를 늘 잡아 둔다. 글자를 지우다 안내가 나타나면서 버튼이 아래로 밀리면,
        마침 그 자리를 누르던 손가락이 '변경' 대신 방금 생긴 여백을 누른다
        (`NicknameEditSheet` 와 같은 이유).
      */}
      <p className="mt-1.5 min-h-[18px] pl-1 text-[13px] leading-[18px] text-error">
        {isEmpty ? '이름을 입력해주세요.' : ''}
      </p>

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-[44px] flex-1 rounded-[12px] bg-line text-[15px] font-medium text-ink"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isEmpty}
          className="h-[44px] flex-1 rounded-[12px] bg-pictree-700 text-[15px] font-medium text-white disabled:bg-line disabled:text-ink-muted"
        >
          변경
        </button>
      </div>
    </Sheet>
  );
}
