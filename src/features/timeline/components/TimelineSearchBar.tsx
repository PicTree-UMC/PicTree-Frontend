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
        className="h-[38px] w-full rounded-full border border-[#2C3930] bg-white px-4 text-center text-[13px] text-[#2C3930] placeholder:text-[#2C3930] focus:outline-none focus:ring-2 focus:ring-[#C5D89D]"
      />
    </div>
  );
}
