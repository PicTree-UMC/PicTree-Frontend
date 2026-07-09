// types/journey.ts
export interface Place {
  id: number;
  name: string;
}

export interface Journey {
  id: number;
  title: string;
  date: string;
  savedAt: string;
  places: Place[];
}