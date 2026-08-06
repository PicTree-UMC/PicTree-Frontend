import { useQuery } from '@tanstack/react-query';
import { getMyBlogPlaces } from '../api/blogPlacesApi';

/** 블로그 목록과 상세에서 같은 나무 원본 및 캐시를 공유한다. */
export const blogTreeQueryKey = ['blog', 'trees'] as const;

export function useBlogTrees() {
  return useQuery({
    queryKey: blogTreeQueryKey,
    queryFn: getMyBlogPlaces,
  });
}
