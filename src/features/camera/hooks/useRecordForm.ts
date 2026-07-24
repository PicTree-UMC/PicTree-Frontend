import { useState } from 'react';

/**
 * 기록 폼 입력 상태(기분 이모지 / 상호명 / 한줄평).
 * 작성 모드 폼과 촬영 검토 캡션이 공유하는 데이터를 한곳에서 관리한다.
 */
export function useRecordForm() {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [comment, setComment] = useState('');

  return {
    selectedEmoji,
    setSelectedEmoji,
    placeName,
    setPlaceName,
    comment,
    setComment,
  };
}
