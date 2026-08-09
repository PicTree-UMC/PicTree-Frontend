interface Props {
  value: string;
  onChange: (value: string) => void;
}

/** 시안의 돋보기 아이콘 — 별도 에셋이 없어 인라인 SVG 로 그린다. */
function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="#2C3930" strokeWidth="1.8" />
      <path
        d="M13.5 13.5L17 17"
        stroke="#2C3930"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * 장소명·한줄평 검색 입력.
 *
 * 입력할 때마다 부모가 목록을 다시 거른다 — 서버 호출이 아니라 이미 받아 둔
 * 목록을 훑는 것이라 디바운스 없이도 부담이 없다.
 */
export function TimelineSearchBar({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0">
        <SearchIcon />
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="원하는 장소를 검색해보세요"
        aria-label="장소 또는 한줄평 검색"
        // 검색 버튼으로 열릴 때 마운트되므로 바로 포커스를 준다.
        autoFocus
        /*
          입력값과 플레이스홀더 모두 왼쪽에서 시작한다 — 가운데 정렬이면 글자를
          칠 때마다 이미 친 부분이 좌우로 밀려 읽기 어렵다.

          포커스는 링이 아니라 테두리 색으로 알린다. 링은 테두리 바깥에 겹쳐 그려져
          알약 모양이 두 겹으로 보였다. 굵기는 그대로 두고 색만 바꿔야 레이아웃이
          흔들리지 않는다.

          플레이스홀더는 본문보다 흐리게 — 같은 색이면 이미 입력된 값처럼 읽힌다.
        */
        className="h-[44px] w-full rounded-full border border-[#2C3930] bg-white px-4 text-left text-[15px] text-[#2C3930] placeholder:text-[#8D8D8D] focus:border-[#89986D] focus:outline-none"
      />
    </div>
  );
}
