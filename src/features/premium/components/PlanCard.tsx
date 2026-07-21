type Props = { selected: boolean; title: string; description: string; price: string; recommended?: boolean; onClick: () => void };

export function PlanCard({ selected, title, description, price, recommended, onClick }: Props) {
  return (
    <button className={`flex h-[75px] w-full items-center rounded-xl border-2 bg-white px-[14px] text-left ${selected ? 'border-[#83965c]' : 'border-[#bed793]'}`} onClick={onClick} aria-pressed={selected}>
      <span className={`mr-3 grid h-[22px] w-[22px] place-items-center rounded-full border-2 ${selected ? 'border-[#6f873d]' : 'border-[#aab991]'}`}>{selected && <i className="h-3 w-3 rounded-full bg-[#6f873d]" />}</span>
      <span><strong className="text-[16px]">{title}</strong>{recommended && <em className="ml-3 rounded-full bg-[#8da071] px-2 py-1 text-[10px] not-italic text-white">추천</em>}<small className="block text-[11px] text-[#999]">{description}</small></span>
      <strong className="ml-auto text-[16px]">{price}</strong>
    </button>
  );
}
