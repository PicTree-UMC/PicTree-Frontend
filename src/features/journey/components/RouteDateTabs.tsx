function formatDateLabel(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

interface RouteDateTabsProps {
  dates: string[];
  selectedDate: string | null;
  onSelect: (date: string | null) => void;
}

export function RouteDateTabs({ dates, selectedDate, onSelect }: RouteDateTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
          selectedDate === null ? 'bg-pictree-700 text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        전체
      </button>
      {dates.map((date) => (
        <button
          key={date}
          onClick={() => onSelect(date)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
            selectedDate === date ? 'bg-pictree-700 text-white' : 'bg-gray-100 text-gray-500'
          }`}
        >
          {formatDateLabel(date)}
        </button>
      ))}
    </div>
  );
}
