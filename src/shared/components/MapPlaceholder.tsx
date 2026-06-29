export function MapPlaceholder() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#e8edf0]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {/* 격자 배경 */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cfd8dc" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* 블록 (건물) */}
        <rect x="20" y="60" width="60" height="40" rx="2" fill="#d0dce3" />
        <rect x="100" y="40" width="80" height="55" rx="2" fill="#d0dce3" />
        <rect x="200" y="70" width="50" height="35" rx="2" fill="#d0dce3" />
        <rect x="20" y="180" width="70" height="50" rx="2" fill="#d0dce3" />
        <rect x="210" y="160" width="90" height="60" rx="2" fill="#d0dce3" />
        <rect x="30" y="320" width="55" height="45" rx="2" fill="#d0dce3" />
        <rect x="110" y="300" width="65" height="55" rx="2" fill="#d0dce3" />
        <rect x="220" y="310" width="70" height="40" rx="2" fill="#d0dce3" />
        <rect x="40" y="460" width="80" height="50" rx="2" fill="#d0dce3" />
        <rect x="200" y="450" width="60" height="60" rx="2" fill="#d0dce3" />

        {/* 큰 도로 (세로) */}
        <rect x="155" y="0" width="14" height="100%" fill="#f0f4f5" />
        {/* 큰 도로 (가로) */}
        <rect x="0" y="240" width="100%" height="14" fill="#f0f4f5" />

        {/* 작은 도로 (세로) */}
        <rect x="95" y="0" width="7" height="100%" fill="#e2eaed" />
        <rect x="260" y="0" width="7" height="100%" fill="#e2eaed" />

        {/* 작은 도로 (가로) */}
        <rect x="0" y="140" width="100%" height="7" fill="#e2eaed" />
        <rect x="0" y="390" width="100%" height="7" fill="#e2eaed" />

        {/* 공원 느낌 */}
        <rect x="105" y="155" width="42" height="75" rx="4" fill="#c8dfc8" />
      </svg>

      {/* 현재 위치 마커 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow-md" />
      </div>
    </div>
  );
}
