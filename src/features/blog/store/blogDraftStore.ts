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

export const useBlogDraftStore = create<BlogDraftState>((set) => ({
  savedBlogs: [],
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
      // 실패 시 빈 목록으로 둔다(서버에 아직 없는 엔드포인트일 수 있음).
      // TODO: 사용자 토스트/에러 핸들링
      console.error('fetchSavedBlogs failed', err);
      set({ savedBlogs: [] });
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
      console.error('saveDraft failed', err);
    }
  },
  deleteBlogAsync: async (id: number) => {
    try {
      await deleteAIBlogDraft(undefined, id);
      set((state) => ({ savedBlogs: state.savedBlogs.filter((b) => b.id !== String(id)) }));
    } catch (err) {
      console.error('deleteBlogAsync failed', err);
    }
  },
}));
