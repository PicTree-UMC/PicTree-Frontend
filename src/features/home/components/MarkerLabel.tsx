/** 지도 위 마커 라벨. CustomOverlay content 생성 시 renderToStaticMarkup 으로 문자열화해서 사용. */

type PinLabelProps = {
  variant: 'pin';
  emoji: string;
  label: string;
};

type PlaceLabelProps = {
  variant: 'place';
  title: string;
  subtitle: string;
  caption: string;
};

export type MarkerLabelProps = PinLabelProps | PlaceLabelProps;

export function MarkerLabel(props: MarkerLabelProps) {
  if (props.variant === 'pin') {
    return (
      <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-neutral-200 bg-white px-2.5 py-1 shadow-md">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-100 text-xs">
          {props.emoji}
        </span>
        <span className="text-xs font-medium text-neutral-800">{props.label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-md">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pictree-100 text-pictree-700">
        📍
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-neutral-900">{props.title}</span>
        <span className="text-[11px] text-neutral-500">{props.subtitle}</span>
        <span className="text-[11px] text-pictree-700">{props.caption}</span>
      </div>
    </div>
  );
}
