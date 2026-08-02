import { useState } from 'react';
import { MOOD_EMOJIS } from '@/shared/constants/moodEmojis';

/**
 * 기록 폼 입력 상태(기분 이모지 / 상호명 / 한줄평).
 * 작성 모드 폼과 촬영 검토 캡션이 공유하는 데이터를 한곳에서 관리한다.
 */
export function useRecordForm() {
  /*
   * 기분 이모지는 첫 번째 값을 기본 선택으로 둔다.
   * null 로 시작하면 PlaceNameBar 가 placeholder 로 첫 이모지(🙂)를 그려 이미 선택된
   * 것처럼 보이는데, 실제 상태는 null 이라 저장 시 "이모지를 입력해 주세요" 가 떠 혼란스럽다.
   * 보이는 대로 실제로도 선택돼 있게 첫 이모지를 기본값으로 채운다.
   */
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(MOOD_EMOJIS[0]);
  const [placeName, setPlaceName] = useState('');
  const [comment, setComment] = useState('');

  // 서버 필수값 기준: 기분 이모지 선택 + 장소명 비어있지 않음(한줄평은 선택).
  const isValid = selectedEmoji !== null && placeName.trim() !== '';

  return {
    selectedEmoji,
    setSelectedEmoji,
    placeName,
    setPlaceName,
    comment,
    setComment,
    isValid,
  };
}
