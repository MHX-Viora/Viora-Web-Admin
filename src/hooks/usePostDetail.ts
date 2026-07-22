import { useQuery } from '@tanstack/react-query';
import { getAdminPost } from '../services/admin-post.service';

export function usePostDetail(id?: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => getAdminPost(id ?? ''),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
