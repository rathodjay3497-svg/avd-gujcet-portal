import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, usersAPI } from '@/services/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

function isProfileComplete(user) {
  return !!(user?.name && user?.dob && user?.gender && user?.stream && user?.medium && user?.address && user?.school_college);
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, logout: storeLogout } = useAuthStore();

  const sendOTP = async (phone) => {
    setLoading(true);
    try {
      await authAPI.sendOTP(phone);
      toast.success('OTP sent to your phone!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Failed to send OTP');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (phone, otp, redirectTo) => {
    setLoading(true);
    try {
      const { data: authData } = await authAPI.verifyOTP(phone, otp);
      const token = authData.access_token;
      const user = authData.user || { phone };

      // Set auth state
      setAuth(token, user, false);

      toast.success('Login successful!');

      // Navigate based on context
      if (redirectTo) {
        navigate(redirectTo);
      } else if (isProfileComplete(user)) {
        navigate('/');
      } else {
        navigate('/profile', { state: { message: 'Please complete your profile.' } });
      }

      return true;
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Invalid OTP');
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

  return { sendOTP, verifyOTP, adminLogin, logout, loading };
}
