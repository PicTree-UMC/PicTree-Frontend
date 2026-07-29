import { create } from 'zustand';
import type { SavedBlog } from '../types/blog';

type BlogDraftState = {
  savedBlogs: SavedBlog[];
  addBlog: (blog: SavedBlog) => void;
  deleteBlog: (id: string) => void;
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
}));
