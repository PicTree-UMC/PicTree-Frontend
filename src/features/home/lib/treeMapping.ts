import type { MapMarkerData } from '../hooks/useMapMarkers';
import type { TreeDetail, TreeListItem, TreeMood } from '../types/tree';

/** 서버 mood 코드 → 지도/상세시트에 노출할 이모지. */
const MOOD_EMOJI: Record<TreeMood, string> = {
  HAPPY: '😊',
  SAD: '😢',
  NORMAL: '😌',
};

export const moodToEmoji = (mood: TreeMood): string => MOOD_EMOJI[mood] ?? '😊';

/** ISO 날짜 문자열 → 'YYYY-MM-DD'. */
const toDateString = (iso: string): string => iso.slice(0, 10);

/**
 * 지도 목록 아이템 → 마커.
 * 목록 응답에는 코멘트·사진·날짜가 없어, 마커 탭 시 상세로 채운다.
 */
export const listItemToMarker = (item: TreeListItem): MapMarkerData => ({
  id: String(item.treeId),
  lat: item.latitude,
  lng: item.longitude,
  emoji: moodToEmoji(item.mood),
  label: item.name,
  date: '',
  comment: '',
  isFavorite: item.isFavorite,
});

/** 상세 응답 → 마커(상세시트용 코멘트·사진·날짜 포함). */
export const detailToMarker = (detail: TreeDetail): MapMarkerData => ({
  id: String(detail.treeId),
  lat: detail.latitude,
  lng: detail.longitude,
  emoji: moodToEmoji(detail.mood),
  label: detail.name,
  date: toDateString(detail.createdAt),
  comment: detail.description ?? '',
  photo: detail.images[0]?.imageUrl,
  isFavorite: detail.isFavorite,
});
