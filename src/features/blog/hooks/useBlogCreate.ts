import { useEffect, useMemo, useState } from 'react';
import type { BlogSection, BlogStatus, ToneId } from '../types/blog';
import { MOCK_BLOG_TREES } from '../mocks/blogTrees';
import { getLocalDateString } from '../../../shared/lib/date';
import { DEFAULT_TONE_ID } from '../constants/blogTones';
import { suggestToneFromMoods } from '../lib/moodTone';
import { generateDraft } from '../lib/generateDraft';

const MOCK_GENERATION_DELAY = 1800;

export type CreateStep = 1 | 2 | 3;

/** 작성 플로우(3스텝)의 상태 기계. 날짜·어체 선택과 목 초안 생성을 관리한다. */
export function useBlogCreate() {
  const [step, setStep] = useState<CreateStep>(1);
  const [startDate, setStartDate] = useState('2026-03-31');
  const [endDate, setEndDate] = useState('2026-04-01');
  const [toneId, setToneId] = useState<ToneId>(DEFAULT_TONE_ID);
  const [status, setStatus] = useState<BlogStatus>('idle');
  const [draft, setDraft] = useState<{ title: string; sections: BlogSection[] } | null>(null);

  const trees = useMemo(
    () => MOCK_BLOG_TREES.filter((tree) => {
      const date = getLocalDateString(new Date(tree.createdAt));
      return date >= startDate && date <= endDate;
    }),
    [startDate, endDate],
  );

  // 초안에 포함할 기록 선택. 기본은 전체 선택이며, 기간(=trees)이 바뀌면 다시 전체로 맞춘다.
  const [selectedTreeIds, setSelectedTreeIds] = useState<number[]>([]);
  useEffect(() => {
    setSelectedTreeIds(trees.map((tree) => tree.treeId));
  }, [trees]);

  const selectedTrees = useMemo(
    () => trees.filter((tree) => selectedTreeIds.includes(tree.treeId)),
    [trees, selectedTreeIds],
  );

  const activityByDate = useMemo(
    () => MOCK_BLOG_TREES.reduce<Record<string, number>>((activity, tree) => {
      const date = getLocalDateString(new Date(tree.createdAt));
      activity[date] = (activity[date] ?? 0) + 1;
      return activity;
    }, {}),
    [],
  );

  // 초안 생성: 결과 스텝 진입 시 목 딜레이 후 완성. 선택된 기록만 사용한다.
  useEffect(() => {
    if (status !== 'generating') return;
    const timer = window.setTimeout(() => {
      setDraft(generateDraft(selectedTrees, toneId, startDate, endDate));
      setStatus('ready');
    }, MOCK_GENERATION_DELAY);
    return () => window.clearTimeout(timer);
  }, [status, selectedTrees, toneId, startDate, endDate]);

  return {
    step,
    startDate,
    endDate,
    toneId,
    status,
    draft,
    trees,
    selectedTreeIds,
    toggleTree: (treeId: number) =>
      setSelectedTreeIds((current) =>
        current.includes(treeId)
          ? current.filter((id) => id !== treeId)
          : [...current, treeId],
      ),
    activityByDate,
    setDateRange: (start: string, end: string) => {
      setStartDate(start);
      setEndDate(end);
    },
    setToneId,
    goToTone: () => {
      // 선택한 기록의 기분 이모지 분포로 어체 기본값을 추천.
      setToneId(suggestToneFromMoods(selectedTrees.map((tree) => tree.mood)));
      setStep(2);
    },
    goToResult: () => {
      setStep(3);
      setStatus('generating');
    },
    back: () => setStep((current) => (current > 1 ? ((current - 1) as CreateStep) : current)),
  };
}
