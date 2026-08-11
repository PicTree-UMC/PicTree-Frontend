/** 선택한 동선을 무엇으로 보여줄지. */
export type RouteViewMode = 'roadmap' | 'map';

const OPTIONS: { mode: RouteViewMode; label: string }[] = [
  { mode: 'roadmap', label: '로드맵' },
  { mode: 'map', label: '지도' },
];

/**
 * 로드맵 ↔ 지도를 그 자리에서 갈아끼우는 세그먼트 피커.
 *
 * **한때 시트 안의 `지도에서 보기` 줄이었다.** 같은 동선을 다른 방식으로 보는 일인데,
 * 한쪽(로드맵)은 화면에 그냥 떠 있고 다른 쪽(지도)은 시트를 열어 메뉴를 골라야 닿았다 —
 * 둘이 대등한 보기 방식이라는 게 화면에 드러나지 않았다. 피커는 지금 무엇을 보고 있는지와
 * 무엇으로 바꿀 수 있는지를 한 자리에서 말한다.
 *
 * 공용 `Chip` 을 쓰지 않는다. 칩은 낱개로 서서 켜고 끄는 것이고, 이건 **둘 중 하나가 반드시
 * 켜져 있는 트랙**이라 바닥(트랙)이 형태의 일부다. 칩 줄로 그리면 둘 다 꺼 놓은 것처럼 보이는
 * 상태가 그려질 수 있다.
 *
 * 안 고른 칸은 흐리게 죽이지 않는다(`Chip` 과 같은 규칙) — INK-muted 는 비활성 회색이
 * 아니라 보조 텍스트 색이고(크림 위 5.8:1), 선택은 **흰 알약 + medium** 이 말한다.
 */
export function RouteViewPicker({
  value,
  onChange,
}: {
  value: RouteViewMode;
  onChange: (mode: RouteViewMode) => void;
}) {
  return (
    // 트랙은 베이지 서브(#F6F0D7) — 크림 페이지 위에서 면이 읽히는 유일한 역할색이고,
    // 그 위에 뜨는 알약이 흰색이라 둘의 관계가 카드/배경과 같아진다.
    <div className="flex shrink-0 items-center rounded-full bg-cream-sub p-[3px]">
      {OPTIONS.map(({ mode, label }) => {
        const selected = mode === value;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={selected}
            className={`h-8 rounded-full px-3 text-[13px] transition-colors ${
              selected
                ? 'bg-white font-medium text-ink shadow-[0_1px_3px_rgba(0,0,0,0.10)]'
                : 'text-ink-muted'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
