import type { BlogTone, ToneId } from '../types/blog';

/**
 * 어체 4종. 문체(존댓말/반말)는 각 어체에 미리 탑재해 조합 폭발을 막는다.
 * 서버에는 안정적인 tone 코드만 보내고 프롬프트 템플릿은 서버가 소유한다.
 */
export const BLOG_TONES: BlogTone[] = [
  {
    id: 'emotional',
    label: '감성적',
    description: '풍경과 감정을 섬세하게',
    example: '노을 진 골목을 천천히 걸으니 마음이 차분해졌어요.',
  },
  {
    id: 'plain',
    label: '담백',
    description: '군더더기 없이 간결하게',
    example: '저녁에 골목을 걸었어요. 조용하고 좋았어요.',
  },
  {
    id: 'playful',
    label: '유쾌',
    description: '밝고 가벼운 분위기로',
    example: '와 이 골목 미쳤다! 노을 보러 또 와야지.',
  },
  {
    id: 'polite',
    label: '정중',
    description: '격식 있고 차분하게',
    example: '해 질 무렵 골목을 걸으며 하루를 정리하였습니다.',
  },
];

export const DEFAULT_TONE_ID: ToneId = 'emotional';
