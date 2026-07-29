import type { ToneId } from '../types/blog';
import { DEFAULT_TONE_ID } from '../constants/blogTones';

/** 기분 이모지 → 본문에 얹을 형용사. AI 없이 정적 매핑으로 장소별 풍미를 만든다. */
const MOOD_ADJECTIVE: Record<string, string> = {
  '😊': '밝은',
  '😙': '다정한',
  '😌': '차분한',
  '😍': '설레는',
  '🥳': '들뜬',
  '😜': '장난스러운',
  '😢': '아쉬운',
  '😭': '벅찬',
  '😯': '신기한',
  '😎': '여유로운',
  '😔': '가라앉은',
  '🥺': '애틋한',
  '😤': '뿌듯한',
  '😬': '멋쩍은',
};

/** 이모지 하나를 어체 버킷으로 분류. 분포 집계로 기본 어체를 추천할 때 쓴다. */
const MOOD_TO_TONE: Record<string, ToneId> = {
  '😊': 'emotional',
  '😙': 'emotional',
  '😍': 'emotional',
  '🥺': 'emotional',
  '😌': 'plain',
  '😯': 'plain',
  '🥳': 'playful',
  '😜': 'playful',
  '😎': 'playful',
  '😢': 'polite',
  '😭': 'polite',
  '😔': 'polite',
  '😤': 'polite',
  '😬': 'polite',
};

export function moodAdjective(mood: string): string {
  return MOOD_ADJECTIVE[mood] ?? '';
}

/**
 * 기간 내 기분 이모지들의 분포를 다수결로 집계해 기본 어체를 추천한다.
 * 동점이면 먼저 등장한 어체, 매칭이 없으면 기본값.
 */
export function suggestToneFromMoods(moods: string[]): ToneId {
  const tally = new Map<ToneId, number>();
  for (const mood of moods) {
    const tone = MOOD_TO_TONE[mood];
    if (!tone) continue;
    tally.set(tone, (tally.get(tone) ?? 0) + 1);
  }

  let best: ToneId = DEFAULT_TONE_ID;
  let bestCount = 0;
  for (const [tone, count] of tally) {
    if (count > bestCount) {
      best = tone;
      bestCount = count;
    }
  }
  return best;
}
