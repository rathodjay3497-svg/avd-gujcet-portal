import { useQuery } from '@tanstack/react-query';
import { eventsAPI } from '@/services/api';

export function useEvents(status = 'active') {
  return useQuery({
    queryKey: ['events', status],
    queryFn: async () => {
      const res = await eventsAPI.list(status);
      const events = res.data || [];
      // Sort: current events first, future_scope events last, each group by start_date ascending
      return events.sort((a, b) => {
        if (a.future_scope !== b.future_scope) return a.future_scope ? 1 : -1;
        return new Date(a.start_date || 0) - new Date(b.start_date || 0);
      });
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

// All events for admin (no status filter, no sorting)
export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const res = await eventsAPI.list('');
      return res.data || [];
    },
    staleTime: 60_000,
  });
}
