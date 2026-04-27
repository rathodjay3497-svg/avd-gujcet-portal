import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/services/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

function isProfileComplete(user) {
  return !!(
    user?.name &&
    user?.phone &&
    user?.gender &&
    user?.stream &&
    user?.medium &&
    user?.address &&
    user?.school_college
  );
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setAuth, logout: storeLogout } = useAuthStore();


  const adminLogin = async (username, password) => {
    setLoading(true);
    try {
      queryClient.clear();
      const { data } = await authAPI.adminLogin(username, password);
      setAuth(data.access_token, { username }, true);
      toast.success('Admin login successful!');
      navigate('/admin');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Invalid credentials');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await storeLogout();
    queryClient.clear(); // wipe all cached query data on logout
    toast.success('Logged out');
    navigate('/');
  };

  return { adminLogin, logout, loading };
}
