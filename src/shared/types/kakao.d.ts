declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions);
  }
  interface MapOptions {
    center: LatLng;
    level: number;
  }
  class LatLng {
    constructor(lat: number, lng: number);
  }
  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }
  interface CustomOverlayOptions {
    position: LatLng;
    content: string | HTMLElement;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }
  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
  }
  interface PolylineOptions {
    path: LatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?:
      | 'solid'
      | 'shortdash'
      | 'shortdot'
      | 'shortdashdot'
      | 'shortdashdotdot'
      | 'dash'
      | 'dot'
      | 'dashdot'
      | 'longdash'
      | 'longdashdot'
      | 'longdashdotdot';
  }
  function load(callback: () => void): void;
}

interface Window {
  kakao: typeof kakao;
}
