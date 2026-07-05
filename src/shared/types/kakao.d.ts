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
  function load(callback: () => void): void;
}

interface Window {
  kakao: typeof kakao;
}
