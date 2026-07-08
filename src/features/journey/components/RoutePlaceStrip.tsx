import { RoutePlace } from '../types/route';

interface RoutePlaceStripProps {
  places: RoutePlace[];
}

export function RoutePlaceStrip({ places }: RoutePlaceStripProps) {
  return (
    <div className="flex gap-4 overflow-x-auto border-t border-gray-100 bg-white px-4 py-3">
      {places.map((place, index) => (
        <div key={place.id} className="flex shrink-0 flex-col items-center gap-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pictree-700 text-xs font-bold text-white">
            {index + 1}
          </span>
          <span className="max-w-[64px] truncate text-[11px] text-gray-500">{place.name}</span>
        </div>
      ))}
    </div>
  );
}
