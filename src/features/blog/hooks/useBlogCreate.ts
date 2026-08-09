import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { BlogDay, BlogDraftPreview, BlogStatus, ToneId, CreateAIBlogDraftRequest } from '../types/blog';
import { getLocalDateString } from '../../../shared/lib/date';
import { DEFAULT_TONE_ID } from '../constants/blogTones';
import { suggestToneFromMoods } from '../lib/moodTone';
import { createAIBlogDraft } from '../api/blogApi';
import { useBlogTrees } from './useBlogTrees';
import { blogDraftUsageKey } from './useBlogDraftUsage';

export type CreateStep = 1 | 2 | 3;

export interface UseBlogCreateOptions {
  /** 동선 페이지 등에서 넘어올 때 미리 채울 기간(YYYY-MM-DD). 없으면 기본값을 쓴다. */
  initialStartDate?: string;
  initialEndDate?: string;
}

const API_TONE_BY_ID: Record<ToneId, CreateAIBlogDraftRequest['tone']> = {
  emotional: 'RECORD',
  plain: 'SIMPLE',
  playful: 'WITTY',
  polite: 'CALM',
};

/** 작성 플로우(3스텝)의 상태 기계. 날짜·어체 선택과 목 초안 생성을 관리한다. */
export function useBlogCreate({ initialStartDate, initialEndDate }: UseBlogCreateOptions = {}) {
  const [step, setStep] = useState<CreateStep>(1);
  const today = getLocalDateString(new Date());
  const [startDate, setStartDate] = useState(initialStartDate ?? today);
  const [endDate, setEndDate] = useState(initialEndDate ?? today);
  const [toneId, setToneId] = useState<ToneId>(DEFAULT_TONE_ID);
  const [status, setStatus] = useState<BlogStatus>('idle');
  const [draft, setDraft] = useState<BlogDraftPreview | null>(null);
  const queryClient = useQueryClient();

  // 목록 화면과 같은 query key를 사용해 나무 전체 조회 결과를 재사용한다.
  const { data: allPlaces = [] } = useBlogTrees();

  const trees = useMemo(
    () => allPlaces.filter((tree) => {
      const date = getLocalDateString(new Date(tree.createdAt));
      return date >= startDate && date <= endDate;
    }),
    [allPlaces, startDate, endDate],
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
    () => allPlaces.reduce<Record<string, number>>((activity, tree) => {
      const date = getLocalDateString(new Date(tree.createdAt));
      activity[date] = (activity[date] ?? 0) + 1;
      return activity;
    }, {}),
    [allPlaces],
  );

  // 초안 생성: 결과 스텝 진입 시 목 딜레이 후 완성. 선택된 기록만 사용한다.
  useEffect(() => {
    if (status !== 'generating') return;

    let cancelled = false;
    (async () => {
      try {
        // 서버에 초안 생성을 요청한다.
        const payload: CreateAIBlogDraftRequest = {
          startDate,
          endDate,
          treeIds: selectedTreeIds,
          tone: API_TONE_BY_ID[toneId],
        };

        const resp = await createAIBlogDraft(payload);

        /*
          토큰이 한 장 소모됐다. `cancelled` 앞에 둔다 — 화면을 벗어나 결과를 안 그리게
          됐어도 서버에서는 이미 차감됐으므로, 무효화까지 건너뛰면 마이페이지 잔량이
          다음 staleTime 까지 옛 값으로 남는다.
        */
        queryClient.invalidateQueries({ queryKey: blogDraftUsageKey });

        if (cancelled) return;

        const days: BlogDay[] = (resp.days ?? []).map((day) => ({
          date: day.date,
          sections: day.items.map((item) => {
            const tree = trees.find((candidate) => candidate.treeId === item.treeId);
            return {
              treeId: item.treeId,
              heading: item.placeName,
              body: item.content,
              image: item.imageUrl ?? tree?.defaultImage ?? '',
            };
          }),
        }));

        setDraft({ title: resp.title, days });
        setStatus('ready');
      } catch (err) {
        // 실패하면 상태를 idle로 돌리고 로그를 남긴다.
        // TODO: 사용자-facing 에러 처리(toast 등)
        console.error('create draft failed', err);
        setStatus('idle');
      }
    })();

    return () => { cancelled = true; };
  }, [status, selectedTreeIds, toneId, startDate, endDate, trees, queryClient]);

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
