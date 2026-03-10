import axios from 'axios';
import useAuthStore from '@/store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — auto-logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = useAuthStore.getState().token;
      // Don't auto-logout on mock token — API calls will naturally fail
      if (token && token !== 'fake-user-token') {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  sendOTP: (phone) => api.post('/auth/otp/send', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/otp/verify', { phone, otp }),
  adminLogin: (username, password) => api.post('/auth/admin/login', { username, password }),
};

// ─── Events ──────────────────────────────────────────────────
export const eventsAPI = {
  list: (status = 'active') => api.get('/events', { params: { status_filter: status } }),
  get: (eventId) => api.get(`/events/${eventId}`),
  create: (data) => api.post('/events', data),
  update: (eventId, data) => api.put(`/events/${eventId}`, data),
  updateStatus: (eventId, status) => api.patch(`/events/${eventId}/status`, { status }),
  delete: (eventId) => api.delete(`/events/${eventId}`),
};

// ─── Registrations ───────────────────────────────────────────
export const registrationsAPI = {
  register: (eventId, phone, formData) =>
    api.post(`/registrations/${eventId}`, { phone, form_data: formData }),
  clickRegister: (eventId) => api.post(`/registrations/${eventId}/click`),
  myRegistrations: () => api.get('/registrations/me'),
  check: (eventId, phone) => api.get(`/registrations/${eventId}/check`, { params: { phone } }),
  downloadPdf: (regId, eventId) => api.get(`/registrations/${regId}/pdf`, { params: { event_id: eventId } }),
};

// ─── Admin ───────────────────────────────────────────────────
export const adminAPI = {
  getRegistrations: (eventId) => api.get(`/admin/registrations/${eventId}`),
  exportCSV: (eventId) => api.get(`/admin/registrations/${eventId}/export`, { responseType: 'blob' }),
  getStats: (eventId) => api.get(`/admin/stats/${eventId}`),
  sendNotifications: (eventId, data) => api.post(`/admin/notify/${eventId}`, data),
  listUsers: () => api.get('/admin/users'),
};

// ─── Users ───────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
};

export default api;
