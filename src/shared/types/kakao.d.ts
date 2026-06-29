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
  function load(callback: () => void): void;
}

interface Window {
  kakao: typeof kakao;
}
