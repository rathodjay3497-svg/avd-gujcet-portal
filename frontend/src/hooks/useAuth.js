import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, usersAPI } from '@/services/api';
import useAuthStore from '@/store/authStore';
import toast from 'react-hot-toast';

function isProfileComplete(user) {
  return !!(user?.name && user?.stream && user?.medium && user?.address && user?.school_college);
}

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, logout: clearAuth } = useAuthStore();

  const sendOTP = async (phone) => {
    setLoading(true);
    try {
      // await authAPI.sendOTP(phone);
      await new Promise((r) => setTimeout(r, 500));
      toast.success('OTP sent to your phone! (MOCK)');
      return true;
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (phone, otp, redirectTo) => {
    setLoading(true);
    try {
      // Mock OTP verification (keep for testing)
      await new Promise((r) => setTimeout(r, 500));
      if (otp !== '123456') throw new Error('Invalid OTP');

      // TODO: Replace mock token with real auth when backend OTP is ready
      // const { data: authData } = await authAPI.verifyOTP(phone, otp);
      // const token = authData.access_token;
      const token = 'fake-user-token';

      // Set auth with minimal user data first (phone from login)
      setAuth(token, { phone }, false);

      // Fetch full profile from DB (skip if using mock token)
      let user = { phone };
      const isMockToken = token === 'fake-user-token';
      if (!isMockToken) {
        try {
          const { data } = await usersAPI.getProfile();
          user = data;
          useAuthStore.getState().updateUser(user);
        } catch (e) {
          // Profile doesn't exist yet (new user) — that's fine
          console.log('No existing profile found, new user');
        }
      }

      toast.success('Login successful!');

      // If a specific redirect was requested (e.g. from event registration), use it
      if (redirectTo) {
        navigate(redirectTo);
      } else if (!isMockToken && isProfileComplete(user)) {
        // Profile complete → go to events page
        navigate('/');
      } else {
        // Profile incomplete or mock → go to profile to fill details
        navigate('/profile', { state: { message: 'Please complete your profile.' } });
      }

      return true;
    } catch (err) {
      toast.error(err.message || 'Invalid OTP');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (username, password) => {
    setLoading(true);
    try {
      // const { data } = await authAPI.adminLogin(username, password);
      await new Promise((r) => setTimeout(r, 500));

      if (username !== 'jay' || password !== '123') {
        throw new Error('Invalid credentials');
      }

      const data = { access_token: 'fake-admin-token' };
      setAuth(data.access_token, { username }, true);
      toast.success('Admin login successful! (MOCK)');
      navigate('/admin');
      return true;
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    toast.success('Logged out');
    navigate('/');
  };

  return { sendOTP, verifyOTP, adminLogin, logout, loading };
}
