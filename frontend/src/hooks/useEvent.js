import { useQuery } from '@tanstack/react-query';
import { eventsAPI } from '@/services/api';

const mockEvents = [
  {
    event_id: 'gujcet-2026',
    title: 'GUJCET Practice Session',
    status: 'active',
    start_date: '2026-03-17T10:00:00Z',
    end_date: '2026-03-27T14:00:00Z',
    venue: 'Anand Coaching Centre, A.V. Road, Anand ',
    fee: 1500,
    organized_by: 'Suhrad Youth',
    streams: ['All Subjects', "Gujarati Medium", "English Medium"],
    registration_type: 'full_form',
    registration_deadline: '2026-05-10T23:59:59Z',
    description: 'Join us for a massive seminar discussing cut-offs, fee structures, and the complete ACPC process for securing a seat in top-tier Engineering colleges in Gujarat.',
  },
  {
    event_id: 'c-lang-2026',
    title: 'C Language Class',
    status: 'active',
    future_scope: true,
    start_date: '2026-08-01T10:00:00Z',
    end_date: '2026-09-01T12:00:00Z',
    venue: 'Virtual',
    organized_by: 'Suhrad Youth',
    streams: ['Engineering'],
    registration_type: 'full_form',
    registration_deadline: '2026-07-31T23:59:59Z',
    description: 'Learn C programming from scratch. This course focuses on fundamental concepts required for future engineering studies.',
  },
  {
    event_id: 'spoken-eng-2026',
    title: 'Spoken English',
    status: 'active',
    future_scope: true,
    start_date: '2026-08-15T16:00:00Z',
    end_date: '2026-09-15T18:00:00Z',
    venue: 'Town Hall, Ashram Road, Ahmedabad',
    organized_by: 'Suhrad Youth',
    streams: ['All Streams'],
    registration_type: 'full_form',
    registration_deadline: '2026-08-10T23:59:59Z',
    description: 'Improve your communication skills before starting college. This class focuses on spoken English, interview preparation, and confidence building.',
  }
];

export function useEvents(status = 'active') {
  return useQuery({
    queryKey: ['events', status],
    queryFn: async () => {
      try {
        const res = await eventsAPI.list(status);
        if (res.data && res.data.length > 0) return res.data;
      } catch (e) {
        console.log("No backend running, using mock info");
      }
      return status === 'active' ? mockEvents : [];
    },
  });
}

export function useEvent(eventId) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      try {
        const res = await eventsAPI.get(eventId);
        if (res.data) return res.data;
      } catch (e) {
        console.log("Using mock event info");
      }
      return mockEvents.find(e => e.event_id === eventId) || mockEvents[0];
    },
    enabled: !!eventId,
  });
}
