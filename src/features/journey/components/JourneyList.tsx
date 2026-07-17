import { Journey } from '../types/journey';
import { JourneyCard } from './JourneyCard';

interface JourneyListProps {
  journeys: Journey[];
  onDelete: (journey: Journey) => void;
  onClick: (journey: Journey) => void;
}

export function JourneyList({ journeys, onDelete, onClick }: JourneyListProps) {
  return (
    <div className="flex flex-col gap-[18px]">
      {journeys.map(journey => (
        <JourneyCard
          key={journey.id}
          journey={journey}
          onDelete={onDelete}
          onClick={onClick}
        />
      ))}
    </div>
  );
}