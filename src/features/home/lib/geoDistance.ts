/**
 * 두 좌표 사이의 거리(m). Haversine 공식.
 *
 * 서버가 `ST_Distance_Sphere` 로 재는 것과 같은 구면 거리다 — 수백 m 범위에서는
 * 두 방식의 차이가 1m 미만이라 알림 판정에 영향이 없다.
 */
export const distanceInMeters = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number => {
  const EARTH_RADIUS_M = 6_371_000;
  const toRad = (degree: number) => (degree * Math.PI) / 180;

  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
};
