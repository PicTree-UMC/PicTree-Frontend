import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';

interface RouteNameFieldProps {
  value: string;
  onChange: (name: string) => void;
  /** 엔터로도 저장되게. 눌러도 되는 상태인지는 부모가 판단한다. */
  onSubmit: () => void;
}

/**
 * 동선 이름 입력 한 줄 — **`RoutePlaceStrip` 의 머리 줄에 들어간다**(따라가기 줄 자리).
 *
 * 이름 짓기는 화면을 갈아끼우는 단계가 아니라 **시트에 줄 하나가 더 붙는 일**이다. 아래
 * 날짜 필터와 장소 목록은 그대로 남는다 — 저장 직전이야말로 무엇이 저장되는지 눈으로
 * 확인할 자리이고, 목록을 치우면 시트가 텅 비어 결국 딴 화면이 뜬 것처럼 읽힌다.
 * (그래서 시트 높이도 이 단계에서 안 변한다. 바뀔 이유가 없다.)
 *
 * 저장 버튼은 여기 없다 — 네비바 오른쪽이다. 이 단계에서는 시트가 '무엇을 저장할지'를
 * 보여주고 화면 머리가 '저장할지 말지'를 묻는다. 되돌리기(취소)도 같은 줄의 뒤로가기다.
 *
 * 자기 가로 여백(`px-5`)을 갖는다 — 시트가 여백을 주지 않고 안쪽 줄들이 각자 갖는 규칙이다.
 */
export function RouteNameField({ value, onChange, onSubmit }: RouteNameFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 표시용 버튼을 탭하면 실제 입력창을 동기 렌더한 직후 포커스한다.
  // preventScroll 로 iOS 가 배경을 밀어올리는 자동 스크롤을 막는다 —
  // 시트를 키보드 위로 올리는 건 페이지가 `bottom` 으로 맡는다.
  const startEditing = () => {
    flushSync(() => setIsEditing(true));
    inputRef.current?.focus({ preventScroll: true });
  };

  return (
    // 페이드로 들어온다. 시트는 제자리에 있고 이 줄만 갈리는 전환이라, 툭 나타나면
    // 그것만으로 시트가 새로 뜬 것처럼 읽힌다.
    <div className="shrink-0 px-5 pb-1 motion-safe:animate-fade-in">
      {/* 알약 입력창은 시안 그대로 두되 테두리를 얻었다 — 크림 채움(#fffdf7)은 세이지 시트
          위에서만 떠 보였고, strip 의 흰 바닥에서는 입력할 자리가 있다는 것 자체가 안 보인다. */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && onSubmit()}
          onBlur={() => setIsEditing(false)}
          aria-label="동선 이름"
          placeholder="동선 이름 입력"
          className="h-11 w-full rounded-full border border-[#ececec] bg-white px-6 text-[15px] text-[#2c3930] outline-none placeholder:text-[#b4b4b4]"
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="h-11 w-full truncate rounded-full border border-[#ececec] bg-white px-6 text-left text-[15px] text-[#2c3930]"
        >
          {value || <span className="text-[#b4b4b4]">동선 이름 입력</span>}
        </button>
      )}
    </div>
  );
}
