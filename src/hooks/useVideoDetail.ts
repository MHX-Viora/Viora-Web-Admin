import { useQuery } from '@tanstack/react-query';
import { getAdminVideo } from '../services/admin-video.service';

export function useVideoDetail(id?: string) {
  return useQuery({
    queryKey: ['video-detail', id],
    queryFn: () => getAdminVideo(id ?? ''),
    enabled: Boolean(id),
  });
}
