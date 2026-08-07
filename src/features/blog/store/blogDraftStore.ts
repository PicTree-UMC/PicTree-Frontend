import { create } from 'zustand';
import type { AIBlogDraft, SaveAIBlogDraftRequest } from '../types/blog';
import { getAIBlogDrafts, saveAIBlogDraft, deleteAIBlogDraft } from '../api/blogApi';

type BlogDraftState = {
  savedBlogs: AIBlogDraft[];
  isLoading: boolean;
  fetchError: boolean;
  fetchSavedBlogs: () => Promise<void>;
  saveDraft: (payload: SaveAIBlogDraftRequest) => Promise<void>;
  deleteBlogAsync: (id: number) => Promise<void>;
};

export const useBlogDraftStore = create<BlogDraftState>((set) => ({
  savedBlogs: [],
  isLoading: false,
  fetchError: false,
  fetchSavedBlogs: async () => {
    set({ isLoading: true, fetchError: false });
    try {
      const data = await getAIBlogDrafts();
      set({ savedBlogs: data.drafts, isLoading: false });
    } catch (err) {
      console.error('fetchSavedBlogs failed', err);
      set({ savedBlogs: [], isLoading: false, fetchError: true });
    }
  },
  saveDraft: async (payload: SaveAIBlogDraftRequest) => {
    await saveAIBlogDraft(payload);
    const data = await getAIBlogDrafts();
    set({ savedBlogs: data.drafts, fetchError: false });
  },
  deleteBlogAsync: async (id: number) => {
    await deleteAIBlogDraft(id);
    set((state) => ({ savedBlogs: state.savedBlogs.filter((draft) => draft.draftId !== id) }));
  },
}));
