import { create } from 'zustand';
import { authAPI } from '@/services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAdmin: false,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (token, user, isAdmin = false) =>
    set({
      token,
      user,
      isAdmin,
      isAuthenticated: true,
      isLoading: false,
    }),

  clearSession: () =>
    set({
      user: null,
      token: null,
      isAdmin: false,
      isAuthenticated: false,
      isLoading: false,
    }),

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // Cookie might already be gone — that's fine
    }
    set({
      user: null,
      token: null,
      isAdmin: false,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  checkAuth: async () => {
    try {
      const { data } = await authAPI.checkAuth();
      set({
        token: data.token,
        user: data.user,
        isAdmin: data.user?.role === 'admin',
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    } catch (e) {
      set({
        user: null,
        token: null,
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false,
      });
      return false;
    }
  },

  updateUser: (userData) =>
    set((state) => ({
      user: { ...state.user, ...userData },
    })),
}));

export default useAuthStore;
