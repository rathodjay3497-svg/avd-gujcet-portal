import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { setAuth, logout: storeLogout } = useAuthStore();

  const googleLogin = async (credential, redirectTo) => {
    setLoading(true);
    try {
      const { data: authData } = await authAPI.googleLogin(credential);
      const token = authData.access_token;
      const user = authData.user || {};

      setAuth(token, user, false);
      toast.success('Login successful!');

      if (authData.is_new_user || !isProfileComplete(user)) {
        navigate('/profile', { 
          state: { 
            message: 'Please complete your profile details before registering for an event.',
            returnTo: redirectTo 
          } 
        });
      } else if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate('/');
      }

      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Google login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (username, password) => {
    setLoading(true);
    try {
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
    toast.success('Logged out');
    navigate('/');
  };

  return { googleLogin, adminLogin, logout, loading };
}
