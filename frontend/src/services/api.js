import axios from 'axios';
import useAuthStore from '@/store/authStore';

// baseURL: 'https://hadtg6sq6whqva6aajw3o4a7qu0rxdpj.lambda-url.ap-south-1.on.aws'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});


// Attach JWT from Zustand as Authorization header on every request
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
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  adminLogin: (username, password) => api.post('/auth/admin/login', { username, password }),
  checkAuth: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
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
  register: (eventId, formData) =>
    api.post(`/registrations/${eventId}`, { form_data: formData }),
  clickRegister: (eventId) => api.post(`/registrations/${eventId}/click`),
  publicRegister: (eventId, formData) =>
    api.post(`/registrations/${eventId}/public`, formData),
  myRegistrations: () => api.get('/registrations/me'),
  check: (eventId) => api.get(`/registrations/${eventId}/check`),
};

// ─── Admin ───────────────────────────────────────────────────
export const adminAPI = {
  getRegistrations: (eventId) => api.get(`/admin/registrations/${eventId}`),
  exportCSV: (eventId) => api.get(`/admin/registrations/${eventId}/export`, { responseType: 'blob' }),
  getStats: (eventId) => api.get(`/admin/stats/${eventId}`),
  getOverview: () => api.get('/admin/overview'),
  sendNotifications: (eventId, data) => api.post(`/admin/notify/${eventId}`, data),
  listUsers: () => api.get('/admin/users'),
};

// ─── HPCL Cricket ────────────────────────────────────────────
export const hpclAPI = {
  register: (formData) => api.post('/hpcl/register', formData),
  getAdminRegistrations: () => api.get('/hpcl/admin/registrations'),
  updateRegistration: (phone, data) => api.patch(`/hpcl/admin/registrations/${phone}`, data),
  deleteRegistration: (phone) => api.delete(`/hpcl/admin/registrations/${phone}`),
};

// ─── Help Desk ───────────────────────────────────────────────
export const helpDeskAPI = {
  list: () => api.get('/helpdesk/entries'),
  create: (data) => api.post('/helpdesk/entries', data),
  update: (id, data) => api.put(`/helpdesk/entries/${id}`, data),
  delete: (id) => api.delete(`/helpdesk/entries/${id}`),
  getSettings: () => api.get('/helpdesk/settings'),
  updateSettings: (data) => api.put('/helpdesk/settings', data),
};

// ─── Users ───────────────────────────────────────────────────
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
};

export default api;
