// types/journey.ts
export interface Place {
  id: number;
  name: string;
}

/** 동선에서 찍은 사진. url이 없으면 앨범에서 회색 플레이스홀더로 그려진다. */
export interface JourneyPhoto {
  id: number;
  url?: string;
  placeName?: string;
}

export interface Journey {
  id: number;
  title: string;
  date: string;
  savedAt: string;
  places: Place[];
  photos: JourneyPhoto[];
}
