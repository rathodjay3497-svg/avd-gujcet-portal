import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { registrationsAPI, usersAPI } from '@/services/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, phone, formData }) => {
      const { data } = await registrationsAPI.register(eventId, phone, formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['check-registration'] });
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map(e => {
          const field = e.loc?.[e.loc.length - 1] || 'field';
          return `${field}: ${e.msg}`;
        });
        toast.error(messages.join('\n'), { duration: 5000 });
      } else {
        toast.error(detail || 'Registration failed');
      }
    },
  });
}

export function useClickRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId) => {
      const { data } = await registrationsAPI.clickRegister(eventId);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['check-registration'] });
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const messages = detail.map(e => {
          const field = e.loc?.[e.loc.length - 1] || 'field';
          return `${field}: ${e.msg}`;
        });
        toast.error(messages.join('\n'), { duration: 5000 });
      } else {
        toast.error(detail || 'Registration failed');
      }
    },
  });
}

export function useMyRegistrations() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['my-registrations'],
    queryFn: async () => {
      const { data } = await registrationsAPI.myRegistrations();
      return data;
    },
    enabled: isAuthenticated,
  });
}

export function useCheckRegistration(eventId) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['check-registration', eventId],
    queryFn: async () => {
      if (!isAuthenticated) return { registered: false };
      const { data } = await registrationsAPI.check(eventId);
      return data;
    },
    enabled: !!eventId && isAuthenticated,
  });
}

export function useUpdateProfile() {
  const { updateUser } = useAuthStore();
  return useMutation({
    mutationFn: async (profileData) => {
      const { data } = await usersAPI.updateProfile(profileData);
      return data;
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast.success('Profile updated successfully!');
    },
    onError: (err) => {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Pydantic validation errors: [{loc: ["body","field"], msg: "..."}]
        const messages = detail.map(e => {
          const field = e.loc?.[e.loc.length - 1] || 'field';
          return `${field}: ${e.msg}`;
        });
        toast.error(messages.join('\n'), { duration: 5000 });
      } else if (typeof detail === 'string') {
        toast.error(detail);
      } else {
        toast.error('Failed to update profile. Please check your details and try again.');
      }
    },
  });
}
