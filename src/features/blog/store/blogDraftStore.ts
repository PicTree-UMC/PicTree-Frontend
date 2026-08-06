import { create } from 'zustand';
import type { AIBlogDraft, SavedBlog, SaveAIBlogDraftRequest } from '../types/blog';
import { getAIBlogDrafts, saveAIBlogDraft, deleteAIBlogDraft } from '../api/blogApi';

type BlogDraftState = {
  savedBlogs: SavedBlog[];
  isLoading: boolean;
  fetchError: boolean;
  addBlog: (blog: SavedBlog) => void;
  deleteBlog: (id: string) => void;
  fetchSavedBlogs: () => Promise<void>;
  saveDraft: (payload: SaveAIBlogDraftRequest) => Promise<void>;
  deleteBlogAsync: (id: number) => Promise<void>;
};

const toSavedBlog = (draft: AIBlogDraft): SavedBlog => ({
  id: String(draft.draftId),
  title: draft.title,
  thumbnailUrl: draft.thumbnailUrl,
  placeCount: draft.placeCount,
  startDate: draft.startDate,
  endDate: draft.endDate,
  toneId: 'plain',
  sections: [],
  savedAt: draft.createdAt,
});

export const useBlogDraftStore = create<BlogDraftState>((set) => ({
  savedBlogs: [],
  isLoading: false,
  fetchError: false,
  addBlog: (blog) => set((state) => ({ savedBlogs: [blog, ...state.savedBlogs] })),
  deleteBlog: (id) => set((state) => ({ savedBlogs: state.savedBlogs.filter((blog) => blog.id !== id) })),
  fetchSavedBlogs: async () => {
    set({ isLoading: true, fetchError: false });
    try {
      const data = await getAIBlogDrafts();
      set({ savedBlogs: data.drafts.map(toSavedBlog), isLoading: false });
    } catch (err) {
      console.error('fetchSavedBlogs failed', err);
      set({ savedBlogs: [], isLoading: false, fetchError: true });
    }
  },
  saveDraft: async (payload: SaveAIBlogDraftRequest) => {
    await saveAIBlogDraft(undefined, payload);
    const data = await getAIBlogDrafts();
    set({ savedBlogs: data.drafts.map(toSavedBlog), fetchError: false });
  },
  deleteBlogAsync: async (id: number) => {
    await deleteAIBlogDraft(undefined, id);
    set((state) => ({ savedBlogs: state.savedBlogs.filter((b) => b.id !== String(id)) }));
  },
}));
