import { useQuery } from '@tanstack/react-query';
import { eventsAPI } from '@/services/api';

export function useEvents(status = 'active') {
  return useQuery({
    queryKey: ['events', status],
    queryFn: async () => {
      const res = await eventsAPI.list(status);
      return res.data || [];
    },
  });
}

export function useEvent(eventId) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const res = await eventsAPI.get(eventId);
      return res.data;
    },
    enabled: !!eventId,
  });
}
