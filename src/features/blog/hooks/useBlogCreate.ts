import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouteDetail } from '@/features/route/hooks/useRouteDetail';
import { useRoutePhotos } from '@/features/route/hooks/useRoutePhotos';
import { useSavedRoutes } from '@/features/route/hooks/useSavedRoutes';

import type { BlogDay, BlogDraftPreview, BlogStatus, ToneId, CreateAIBlogDraftRequest } from '../types/blog';
import { getLocalDateString } from '../../../shared/lib/date';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { DEFAULT_TONE_ID } from '../constants/blogTones';
import { suggestToneFromMoods } from '../lib/moodTone';
import { createAIBlogDraft } from '../api/blogApi';
import { blogDraftUsageKey } from './useBlogDraftUsage';

export type CreateStep = 1 | 2 | 3;

export interface UseBlogCreateOptions {
  /** 동선 목록에서 "AI 블로그 작성"으로 넘어올 때 이미 정해진 동선. 있으면 1단계가 그것으로 채워진다. */
  initialRouteId?: number;
}

const API_TONE_BY_ID: Record<ToneId, CreateAIBlogDraftRequest['tone']> = {
  emotional: 'RECORD',
  plain: 'SIMPLE',
  playful: 'WITTY',
  polite: 'CALM',
};

/**
 * 작성 플로우(3스텝)의 상태 기계.
 *
 * ⚠️ **초안의 입력 단위가 '기간' 에서 '저장한 동선' 으로 바뀌었다**(이슈 #212).
 *
 * 종전에는 기간을 고르면 그 안의 나무가 **전부 자동 선택**돼 그대로 `treeIds` 에 실렸다.
 * 기록이 쌓인 계정일수록 한 번에 들어가는 양을 아무도 통제하지 못했고, 초안 품질도 요청
 * 크기도 거기서 무너졌다. 동선은 이미 "한 여행" 이라는 뜻을 갖고 장소가 20개로 묶여 있어,
 * **사용자가 의도한 범위가 그대로 초안의 범위**가 된다.
 *
 * 그래서 기간·나무 선택은 여기서 정하지 않는다 — 고른 동선의 상세(`GET /routes/{id}`)에서
 * 파생될 뿐이다. 화면이 날짜를 만지던 `setDateRange`·`toggleTree`·`activityByDate` 도 함께
 * 사라졌다(그 셋을 쓰던 `DateStep`·`BlogDateRangePicker`·`BlogRoadmap` 도).
 *
 * 부수 효과로 **나무 전체 조회(`useBlogTrees`, 1+N 페이지)가 이 흐름에서 빠졌다.** 필요한 건
 * 동선 하나에 속한 것뿐이라 동선 상세·사진 두 요청으로 끝난다.
 */
export function useBlogCreate({ initialRouteId }: UseBlogCreateOptions = {}) {
  const [step, setStep] = useState<CreateStep>(1);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(initialRouteId ?? null);
  const [toneId, setToneId] = useState<ToneId>(DEFAULT_TONE_ID);
  const [status, setStatus] = useState<BlogStatus>('idle');
  const [draft, setDraft] = useState<BlogDraftPreview | null>(null);
  const queryClient = useQueryClient();
  /** 실패 사유. 서버가 준 문구를 그대로 든다 — `status === 'error'` 일 때만 의미가 있다. */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const routesQuery = useSavedRoutes();
  const detailQuery = useRouteDetail(selectedRouteId ?? undefined);
  /*
    결과 화면의 사진 폴백용. 초안 응답이 `imageUrl` 을 안 채워 준 칸을 그 장소의 대표
    사진으로 메운다 — 종전에 나무 전체 목록에서 하던 일을 동선 범위로 좁힌 것이다.
  */
  const photosQuery = useRoutePhotos(selectedRouteId ?? undefined);

  const places = detailQuery.data?.places;

  /**
   * 초안에 넣을 나무들.
   *
   * ⚠️ **중복을 걷어낸다.** 한 동선에서 같은 장소를 다시 들르면 노드가 두 개지만 나무는
   * 하나다(`RoutePlace.id` 가 `treeId` 가 아니라 방문 순서인 이유와 같다). 그대로 보내면
   * 서버가 같은 기록을 두 번 받아 초안에 같은 문단이 겹쳐 나온다.
   */
  const treeIds = useMemo(
    () => [...new Set((places ?? []).map((place) => place.treeId).filter((id): id is number => id != null))],
    [places],
  );

  /**
   * 기간은 **동선이 정한다** — 노드 날짜의 최소·최대다.
   *
   * 저장할 때(`POST /blog-drafts`) 쓰는 값이라 비워 둘 수 없다. 날짜가 하나도 없는 동선은
   * 있을 수 없지만(노드가 곧 기록이다), 서버가 빈 값을 주면 오늘로 버틴다.
   */
  const today = getLocalDateString(new Date());
  const sortedDates = useMemo(
    () => (places ?? []).map((place) => place.date).filter(Boolean).sort(),
    [places],
  );
  const startDate = sortedDates[0] ?? today;
  const endDate = sortedDates[sortedDates.length - 1] ?? today;

  const selectedRoute = routesQuery.data?.find((route) => route.id === selectedRouteId) ?? null;

  /** 고른 동선의 내용까지 받아 와야 다음으로 갈 수 있다 — `treeIds` 없이는 요청을 못 만든다. */
  const canGoToTone = selectedRouteId !== null && treeIds.length > 0;

  // 초안 생성: 결과 스텝 진입 시 서버에 요청한다.
  useEffect(() => {
    if (status !== 'generating') return;

    let cancelled = false;
    (async () => {
      try {
        const payload: CreateAIBlogDraftRequest = {
          startDate,
          endDate,
          treeIds,
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
            const photo = photosQuery.data?.find((candidate) => candidate.treeId === item.treeId);
            return {
              treeId: item.treeId,
              heading: item.placeName,
              body: item.content,
              image: item.imageUrl ?? photo?.url ?? '',
            };
          }),
        }));

        setDraft({ title: resp.title, days });
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;

        // 서버 문구를 그대로 든다. `BLOG400-1` 처럼 조건이 아직 안 밝혀진 실패가 있어
        // 우리가 지어낸 문구로 덮으면 사용자도 우리도 원인을 못 본다.
        console.error('create draft failed', err);
        setErrorMessage(getApiErrorMessage(err, '초안을 만들지 못했어요. 잠시 후 다시 시도해 주세요.'));
        setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [status, treeIds, toneId, startDate, endDate, photosQuery.data, queryClient]);

  return {
    step,
    startDate,
    endDate,
    toneId,
    status,
    errorMessage,
    draft,

    /** 1단계가 그리는 목록. 로딩·실패도 그대로 넘겨 화면이 갈라 그린다. */
    routes: routesQuery.data ?? [],
    isRoutesPending: routesQuery.isPending,
    isRoutesError: routesQuery.isError,
    refetchRoutes: routesQuery.refetch,

    selectedRouteId,
    selectedRoute,
    selectRoute: setSelectedRouteId,
    /** 고른 동선의 내용을 받는 중. 이 동안 '다음' 을 눌러도 보낼 `treeIds` 가 없다. */
    isRouteDetailPending: selectedRouteId !== null && detailQuery.isPending,
    isRouteDetailError: detailQuery.isError,
    treeIds,
    canGoToTone,

    setToneId,
    goToTone: () => {
      if (!canGoToTone) return;
      // 고른 동선의 기분 분포로 어체 기본값을 추천한다.
      setToneId(
        suggestToneFromMoods(
          (places ?? []).map((place) => place.mood).filter((mood): mood is string => !!mood),
        ),
      );
      setStep(2);
    },
    goToResult: () => {
      setErrorMessage(null);
      setStep(3);
      setStatus('generating');
    },
    /**
     * 실패한 초안 생성을 다시 건다. `generating` 으로 되돌리면 생성 `useEffect` 가
     * `status` 를 보고 다시 돈다 — 재요청 경로를 따로 두지 않는 이유다.
     */
    retryGenerate: () => {
      setErrorMessage(null);
      setStatus('generating');
    },
    back: () => setStep((current) => (current > 1 ? ((current - 1) as CreateStep) : current)),
  };
}
