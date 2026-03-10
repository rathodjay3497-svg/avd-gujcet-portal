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
      toast.error(err.response?.data?.detail || 'Registration failed');
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
      toast.error(err.response?.data?.detail || 'Registration failed');
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

export function useCheckRegistration(eventId, phone) {
  return useQuery({
    queryKey: ['check-registration', eventId, phone],
    queryFn: async () => {
      const { data } = await registrationsAPI.check(eventId, phone);
      return data;
    },
    enabled: !!eventId && !!phone,
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
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    },
  });
}
