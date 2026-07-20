import { RouteFootprintBanner } from "./RouteFootprintBanner";
import { NearbyTreeAlert } from "./NearbyTreeAlert";

interface MapNotificationsProps {
  placeCount?: number;
  showNearbyAlert?: boolean;
  nearbyPlaceName?: string;
  nearbyDistanceM?: number;
  onViewRoute?: () => void;
  onViewTree?: () => void;
}

export function MapNotifications({
  placeCount = 0,
  showNearbyAlert = true,
  nearbyPlaceName,
  nearbyDistanceM,
  onViewRoute,
  onViewTree,
}: MapNotificationsProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[59px] z-10 flex flex-col items-center gap-[10px] [&_button]:pointer-events-auto">
      <RouteFootprintBanner placeCount={placeCount} onViewRoute={onViewRoute} />
      {showNearbyAlert && (
        <NearbyTreeAlert
          placeName={nearbyPlaceName}
          distanceM={nearbyDistanceM}
          onView={onViewTree}
        />
      )}
    </div>
  );
}
