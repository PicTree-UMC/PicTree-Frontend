declare namespace kakao.maps {
  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    getLevel(): number;
    setLevel(level: number, options?: { anchor?: LatLng }): void;
    setCenter(latlng: LatLng): void;
    panTo(latlng: LatLng): void;
    getProjection(): Projection;
    relayout(): void;
    setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
  }
  interface MapOptions {
    center: LatLng;
    level: number;
  }
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }
  class LatLngBounds {
    constructor(sw?: LatLng, ne?: LatLng);
    extend(latlng: LatLng): void;
    isEmpty(): boolean;
  }
  class Point {
    constructor(x: number, y: number);
    x: number;
    y: number;
  }
  interface Projection {
    containerPointFromCoords(latlng: LatLng): Point;
    coordsFromContainerPoint(point: Point): LatLng;
  }
  namespace event {
    function addListener(target: unknown, type: string, handler: () => void): void;
    function removeListener(target: unknown, type: string, handler: () => void): void;
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
