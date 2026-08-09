import { useEffect, useRef, useState } from 'react';
import { Sheet } from '@/shared/components';

/** 서버 `UpdateUserRequestDto` 의 제약. 넘기면 400 이 떨어진다. */
const NICKNAME_MAX = 50;

interface Props {
  currentNickname: string;
  /** 저장 요청이 도는 중. 같은 값이 두 번 나가지 않도록 버튼을 잠근다. */
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (nickname: string) => void;
}

/**
 * 닉네임 편집 시트.
 *
 * `/profile/edit` 이 그룹 리스트로 바뀌면서 페이지에 있던 입력 폼이 이리로 왔다. 줄에는 지금
 * 값만 두고 고치는 일은 시트가 맡는다 — 화면에 상시 열린 입력이 하나뿐인데 그 하나 때문에
 * 페이지가 폼과 목록 두 벌의 언어를 쓰고 있었다.
 *
 * ⚠️ **`avoidKeyboard` 가 필요하다.** 바텀시트는 `fixed bottom-0` 이라, 소프트 키보드가 올라오면
 * 입력이 그 뒤로 들어간다. 셸이 키보드 높이만큼 시트를 띄운다.
 */
export function NicknameEditSheet({ currentNickname, isSaving, onClose, onSubmit }: Props) {
  const [draft, setDraft] = useState(currentNickname);
  const inputRef = useRef<HTMLInputElement>(null);

  // 열자마자 입력 대기 상태로 둔다. `preventScroll` 은 iOS 가 배경을 밀어 올리는
  // 자동 스크롤을 막는다 — 시트를 올리는 건 `avoidKeyboard` 쪽 일이다.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const trimmed = draft.trim();
  const isEmpty = trimmed.length === 0;
  const isTooLong = trimmed.length > NICKNAME_MAX;
  // 안 바뀐 값을 다시 보내면 서버는 성공을 주고 화면은 아무 일도 없다. 눌러도 되는 것처럼
  // 두면 "저장했는데 그대로네" 가 되므로 변경이 있을 때만 연다.
  const isChanged = trimmed !== currentNickname;
  const canSave = isChanged && !isEmpty && !isTooLong && !isSaving;

  const handleSubmit = () => canSave && onSubmit(trimmed);

  return (
    <Sheet
      onClose={onClose}
      label="닉네임 수정"
      handleColor="#D9D9D9"
      handleSize="grip"
      avoidKeyboard
      className="rounded-t-[20px] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.12)]"
      contentClassName="px-6"
      bottomPadding="2rem"
    >
      <h2 className="text-[15px] font-medium text-[#2C3930]">닉네임</h2>

      <div
        className={`mt-3 flex items-center gap-2 rounded-xl border bg-white px-4 py-3 ${
          isEmpty || isTooLong ? 'border-[#DC2626]' : 'border-[#ECECEC]'
        }`}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && handleSubmit()}
          aria-label="닉네임"
          placeholder="닉네임을 입력해주세요"
          className="min-w-0 flex-1 text-[17px] font-medium text-[#2C3930] outline-none placeholder:font-normal placeholder:text-[#B4B4B4]"
        />
        <span className="shrink-0 text-[13px] text-[#60655C]">
          {trimmed.length}/{NICKNAME_MAX}
        </span>
      </div>

      {/*
        빈 자리를 늘 잡아 둔다. 글자를 지우다 안내가 나타나면서 버튼이 아래로 밀리면,
        마침 그 자리를 누르던 손가락이 '저장' 대신 방금 생긴 여백을 누른다.
      */}
      <p className="mt-1.5 min-h-[18px] pl-1 text-[13px] leading-[18px] text-[#DC2626]">
        {isEmpty
          ? '닉네임을 입력해주세요.'
          : isTooLong
            ? `${NICKNAME_MAX}자까지 쓸 수 있어요.`
            : ''}
      </p>

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="h-[44px] flex-1 rounded-[12px] bg-[#D9D9D9] text-[15px] font-medium text-[#2C3930]"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSave}
          className="h-[44px] flex-1 rounded-[12px] bg-[#5B6B38] text-[15px] font-medium text-white disabled:bg-[#D9D9D9] disabled:text-[#60655C]"
        >
          {isSaving ? '저장 중' : '저장'}
        </button>
      </div>
    </Sheet>
  );
}
