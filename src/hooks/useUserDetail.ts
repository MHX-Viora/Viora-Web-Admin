import { useQuery } from '@tanstack/react-query';
import { getUser } from '../services/admin-user.service';

export function useUserDetail(id?: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id ?? ''),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
