import { formatDateLabel } from '../lib/formatDate';

interface RouteDateTabsProps {
  dates: string[];
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}

const tabClass = (active: boolean) =>
  `shrink-0 rounded-[12px] px-5 py-1.5 text-base font-semibold tracking-wide text-[#2c3930] ${
    active ? 'bg-[#9cab84]' : 'bg-[#fffcef]'
  }`;

export function RouteDateTabs({ dates, selectedDate, onSelect }: RouteDateTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-4 pt-3">
      <button onClick={() => onSelect(null)} className={tabClass(selectedDate === null)}>
        전체
      </button>
      {dates.map((date) => (
        <button
          key={date}
          onClick={() => onSelect(date)}
          className={tabClass(selectedDate === date)}
        >
          {formatDateLabel(date)}
        </button>
      ))}
    </div>
  );
}
