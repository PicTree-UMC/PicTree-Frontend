import type { BlogSection, BlogTreeRecord, ToneId } from '../types/blog';
import { formatDateRange } from './formatBlogDate';
import { moodAdjective } from './moodTone';

/** 어체별 문단 마무리 문장. 실제 AI 연동 전까지 쓰는 목 래핑. */
const TONE_CLOSER: Record<ToneId, string> = {
  emotional: '그 순간의 공기와 감정이 오래 마음에 남았어요.',
  plain: '기억에 남는 시간이었어요.',
  playful: '두고두고 생각날 것 같다!',
  polite: '오래도록 기억에 남을 시간이었습니다.',
};

function buildBody(tree: BlogTreeRecord, toneId: ToneId): string {
  const adjective = moodAdjective(tree.mood);
  const opener = adjective ? `${adjective} 마음으로 찾은 ${tree.name}. ` : '';
  return `${opener}${tree.description} ${TONE_CLOSER[toneId]}`.trim();
}

/**
 * 기간 내 나무들과 어체로 초안을 만든다.
 * 각 나무 → 장소별 문단(BlogSection), 이모지 형용사와 어체 마무리를 반영.
 * 실제 AI 생성은 향후 백엔드 연동으로 대체된다.
 */
export function generateDraft(
  trees: BlogTreeRecord[],
  toneId: ToneId,
  startDate: string,
  endDate: string,
): { title: string; sections: BlogSection[] } {
  return {
    title: `[여행기록] ${formatDateRange(startDate, endDate)}`,
    sections: trees.map((tree) => ({
      treeId: tree.treeId,
      heading: tree.name,
      body: buildBody(tree, toneId),
      image: tree.defaultImage,
      mood: tree.mood,
    })),
  };
}
