import { useEffect, useMemo, useState } from 'react';
import type { BlogSection, BlogStatus, ToneId, BlogTreeRecord } from '../types/blog';
import { getLocalDateString } from '../../../shared/lib/date';
import { DEFAULT_TONE_ID } from '../constants/blogTones';
import { suggestToneFromMoods } from '../lib/moodTone';
import { createAIBlogDraft } from '../api/blogApi';
import { getTimelines } from '../../timeline/api/timelineApi';
import { useAuthStore } from '../../auth/store/authStore';

export type CreateStep = 1 | 2 | 3;

/** 작성 플로우(3스텝)의 상태 기계. 날짜·어체 선택과 목 초안 생성을 관리한다. */
export function useBlogCreate() {
  const [step, setStep] = useState<CreateStep>(1);
  const [startDate, setStartDate] = useState('2026-03-31');
  const [endDate, setEndDate] = useState('2026-04-01');
  const [toneId, setToneId] = useState<ToneId>(DEFAULT_TONE_ID);
  const [status, setStatus] = useState<BlogStatus>('idle');
  const [draft, setDraft] = useState<{ title: string; sections: BlogSection[] } | null>(null);

  const accessToken = useAuthStore((s) => s.accessToken);

  const [trees, setTrees] = useState<BlogTreeRecord[]>([]);

  // 서버의 타임라인(기록)에서 기간 필터에 해당하는 장소 목록을 가져온다.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!accessToken) {
          setTrees([]);
          return;
        }
        const pageSize = 100;
        const res = await getTimelines(accessToken, { page: 1, size: pageSize });
        if (cancelled) return;
        // toTimelineRecord 변환을 거친 결과(화면용 레코드)라 필드명이 다르다.
        const filtered = (res.records ?? []).filter((r) => {
          const date = r.createdAt ? getLocalDateString(new Date(r.createdAt)) : '';
          return date >= startDate && date <= endDate;
        }).map((r) => ({
          treeId: Number(r.treeId ?? 0),
          name: r.placeName,
          description: r.comment ?? '',
          latitude: 0,
          longitude: 0,
          address: '',
          mood: '😌',
          defaultImage: r.thumbnailUrl ?? r.defaultImage ?? '',
          createdAt: r.createdAt ?? '',
        } as BlogTreeRecord));

        setTrees(filtered);
      } catch (err) {
        // 실패 시 빈 목록으로 두고 UI 상에서 처리한다.
        // eslint-disable-next-line no-console
        console.error('fetch trees failed', err);
        setTrees([]);
      }
    })();
    return () => { cancelled = true; };
  }, [accessToken, startDate, endDate]);

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
    () => trees.reduce<Record<string, number>>((activity, tree) => {
      const date = getLocalDateString(new Date(tree.createdAt));
      activity[date] = (activity[date] ?? 0) + 1;
      return activity;
    }, {}),
    [trees],
  );

  // 초안 생성: 결과 스텝 진입 시 목 딜레이 후 완성. 선택된 기록만 사용한다.
  useEffect(() => {
    if (status !== 'generating') return;

    let cancelled = false;
    (async () => {
      try {
        // 서버에 초안 생성을 요청한다.
        const payload = {
          startDate,
          endDate,
          treeIds: selectedTreeIds,
          tone: toneId === 'emotional' ? 'RECORD' : 'SIMPLE',
        } as const;

        const resp = await createAIBlogDraft(accessToken ?? undefined, payload as any);

        if (cancelled) return;

        const sections: BlogSection[] = (resp.items ?? []).map((it, idx) => ({
          treeId: selectedTreeIds[idx] ?? 0,
          heading: it.placeName,
          body: it.content,
          image: trees.find((t) => t.name === it.placeName)?.defaultImage ?? '',
          mood: trees.find((t) => t.name === it.placeName)?.mood ?? '😌',
        }));

        setDraft({ title: resp.title, sections });
        setStatus('ready');
      } catch (err) {
        // 실패하면 상태를 idle로 돌리고 로그를 남긴다.
        // TODO: 사용자-facing 에러 처리(toast 등)
        // eslint-disable-next-line no-console
        console.error('create draft failed', err);
        setStatus('idle');
      }
    })();

    return () => { cancelled = true; };
  }, [status, selectedTreeIds, toneId, startDate, endDate, accessToken, trees]);

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
