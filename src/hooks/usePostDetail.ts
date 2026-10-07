import { useQuery } from '@tanstack/react-query';
import { getAdminPost } from '../services/admin-post.service';
import type { PostManagementScope } from '../types/admin-post';

export function usePostDetail(id?: string, scope: PostManagementScope = 'posts') {
  return useQuery({
    queryKey: [scope, id],
    queryFn: () => getAdminPost(id ?? '', scope),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
