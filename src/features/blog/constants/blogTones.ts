import type { BlogTone, ToneId } from '../types/blog';

/**
 * 어체 4종. 문체(존댓말/반말)는 각 어체에 미리 탑재해 조합 폭발을 막는다.
 * `prompt`는 목 생성기 입력 겸, 실제 AI 연동 시 서버 프롬프트 템플릿의 설계 기준.
 */
export const BLOG_TONES: BlogTone[] = [
  {
    id: 'emotional',
    label: '감성적',
    description: '풍경과 감정을 섬세하게',
    example: '노을 진 골목을 천천히 걸으니 마음이 차분해졌어요.',
    prompt: '서정적이고 감성적인 문체로, 풍경 묘사와 그 순간의 감정을 섬세하게 담아 해요체 존댓말로 작성해줘.',
  },
  {
    id: 'plain',
    label: '담백',
    description: '군더더기 없이 간결하게',
    example: '저녁에 골목을 걸었어요. 조용하고 좋았어요.',
    prompt: '군더더기 없이 담백하고 간결한 문체로, 사실 위주의 짧은 문장으로 해요체 존댓말로 작성해줘.',
  },
  {
    id: 'playful',
    label: '유쾌',
    description: '밝고 가벼운 분위기로',
    example: '와 이 골목 미쳤다! 노을 보러 또 와야지.',
    prompt: '밝고 유쾌한 문체로, 가벼운 감탄과 구어체 표현을 섞어 친근한 반말로 작성해줘.',
  },
  {
    id: 'polite',
    label: '정중',
    description: '격식 있고 차분하게',
    example: '해 질 무렵 골목을 걸으며 하루를 정리하였습니다.',
    prompt: '정중하고 차분한 문체로, 격식 있는 합니다체로 작성해줘.',
  },
];

export const DEFAULT_TONE_ID: ToneId = 'emotional';

export const TONE_BY_ID: Record<ToneId, BlogTone> = Object.fromEntries(
  BLOG_TONES.map((tone) => [tone.id, tone]),
) as Record<ToneId, BlogTone>;
