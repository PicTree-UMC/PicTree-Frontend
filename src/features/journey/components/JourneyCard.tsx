import { Journey } from '../types/journey';

interface JourneyCardProps {
  journey: Journey;
  onDelete: (id: number) => void;
  onClick: (journey: Journey) => void;
}

export function JourneyCard({ journey, onDelete, onClick }: JourneyCardProps) {
  return (
    <div
      onClick={() => onClick(journey)}
      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:bg-gray-50"
    >
      {/* 카드 내용 */}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-gray-900">{journey.title}</h3>
        <p className="text-sm text-gray-500">{journey.date}</p>
        <div className="flex gap-2">
          {journey.places.map(place => (
            <span key={place.id} className="text-xs text-gray-400">
              {place.name}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-300">{journey.savedAt}</p>
      </div>

      {/* 삭제 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(journey.id);
        }}
        className="rounded-full bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
      >
        삭제
      </button>
    </div>
  );
}