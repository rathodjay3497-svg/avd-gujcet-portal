import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAdmin: false,
      isAuthenticated: false,

      setAuth: (token, user, isAdmin = false) =>
        set({
          token,
          user,
          isAdmin,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          isAdmin: false,
          isAuthenticated: false,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAdmin: state.isAdmin,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
