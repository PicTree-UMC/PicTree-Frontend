import { create } from 'zustand';
import type { SavedBlog, SaveAIBlogDraftRequest } from '../types/blog';
import { getAIBlogDrafts, saveAIBlogDraft, deleteAIBlogDraft } from '../api/blogApi';

type BlogDraftState = {
  savedBlogs: SavedBlog[];
  addBlog: (blog: SavedBlog) => void;
  deleteBlog: (id: string) => void;
  fetchSavedBlogs: () => Promise<void>;
  saveDraft: (payload: SaveAIBlogDraftRequest) => Promise<void>;
  deleteBlogAsync: (id: number) => Promise<void>;
};

/** 데모용 시드 1건 — 빈 상태/목록 렌더를 둘 다 확인할 수 있게 둔다. */
const SEED_BLOG: SavedBlog = {
  id: 'seed-1',
  title: '[여행기록] 3월 31일 ~ 4월 1일',
  startDate: '2026-03-31',
  endDate: '2026-04-01',
  toneId: 'emotional',
  savedAt: '2026-04-02',
  sections: [
    {
      treeId: 1,
      heading: '포그레인 공원',
      body: '설레는 마음으로 찾은 포그레인 공원. 오아시스 형제가 축구하던 그곳! 근처 맛집에서 햄버거를 사 와 피크닉을 즐겼다. 그 순간의 공기와 감정이 오래 마음에 남았어요.',
      image: 'https://picsum.photos/seed/fog-lane-park/480/480',
      mood: '😍',
    },
  ],
};

export const useBlogDraftStore = create<BlogDraftState>((set) => ({
  savedBlogs: [SEED_BLOG],
  addBlog: (blog) => set((state) => ({ savedBlogs: [blog, ...state.savedBlogs] })),
  deleteBlog: (id) => set((state) => ({ savedBlogs: state.savedBlogs.filter((blog) => blog.id !== id) })),
  fetchSavedBlogs: async () => {
    try {
      const data = await getAIBlogDrafts();
      const saved = data.drafts.map((d) => ({
        id: String(d.draftId),
        title: d.title,
        startDate: d.startDate,
        endDate: d.endDate,
        toneId: 'plain' as const,
        sections: [],
        savedAt: d.createdAt,
      } as SavedBlog));
      set({ savedBlogs: saved });
    } catch (err) {
      // 실패 시 기존 시드 유지
      // TODO: 사용자 토스트/에러 핸들링
      // eslint-disable-next-line no-console
      console.error('fetchSavedBlogs failed', err);
    }
  },
  saveDraft: async (payload: SaveAIBlogDraftRequest) => {
    try {
      await saveAIBlogDraft(undefined, payload);
      // 간단히 목록을 다시 당겨온다
      const data = await getAIBlogDrafts();
      const saved = data.drafts.map((d) => ({
        id: String(d.draftId),
        title: d.title,
        startDate: d.startDate,
        endDate: d.endDate,
        toneId: 'plain' as const,
        sections: [],
        savedAt: d.createdAt,
      } as SavedBlog));
      set({ savedBlogs: saved });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('saveDraft failed', err);
    }
  },
  deleteBlogAsync: async (id: number) => {
    try {
      await deleteAIBlogDraft(undefined, id);
      set((state) => ({ savedBlogs: state.savedBlogs.filter((b) => b.id !== String(id)) }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('deleteBlogAsync failed', err);
    }
  },
}));
