import type { MapMarkerData } from '../hooks/useMapMarkers';
import type { TreeDetail, TreeListItem } from '../types/tree';

/** mood 가 비어 있을 때 마커에 쓸 기본 이모지. */
const FALLBACK_EMOJI = '😊';

/** ISO 날짜 문자열 → 'YYYY-MM-DD'. */
const toDateString = (iso: string): string => iso.slice(0, 10);

/**
 * 지도 목록 아이템 → 마커.
 * 목록 응답에는 코멘트·날짜가 없어, 마커 탭 시 상세로 채운다.
 * 대표 사진(imageUrl)은 목록에 실려오므로 추가 요청 없이 바로 표시한다.
 */
export const listItemToMarker = (item: TreeListItem): MapMarkerData => ({
  id: String(item.treeId),
  lat: item.latitude,
  lng: item.longitude,
  emoji: item.mood || FALLBACK_EMOJI,
  label: item.name,
  date: '',
  comment: '',
  photo: item.imageUrl ?? undefined,
  isFavorite: item.isFavorite,
});

/** 상세 응답 → 마커(상세시트용 코멘트·사진·날짜 포함). */
export const detailToMarker = (detail: TreeDetail): MapMarkerData => ({
  id: String(detail.treeId),
  lat: detail.latitude,
  lng: detail.longitude,
  emoji: detail.mood || FALLBACK_EMOJI,
  label: detail.name,
  date: toDateString(detail.createdAt),
  comment: detail.description ?? '',
  photo: detail.images[0]?.imageUrl,
  isFavorite: detail.isFavorite,
});
