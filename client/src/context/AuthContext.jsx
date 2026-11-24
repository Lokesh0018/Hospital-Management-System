import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('hms_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('hms_access_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state on app start
  const verifyAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('hms_access_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response && response.data) {
        setUser(response.data);
        localStorage.setItem('hms_user', JSON.stringify(response.data));
      }
    } catch (err) {
      console.warn('Session verification failed, clearing tokens:', err.message);
      localStorage.removeItem('hms_access_token');
      localStorage.removeItem('hms_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth();

    // Listen for custom 401 unauthorized events dispatched by axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [verifyAuth]);

  /**
   * Login user with credentials
   * @param {string} email
   * @param {string} password
   */
  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    if (response?.data?.tokens?.accessToken && response?.data?.user) {
      const { user: userData, tokens } = response.data;
      localStorage.setItem('hms_access_token', tokens.accessToken);
      localStorage.setItem('hms_user', JSON.stringify(userData));
      setToken(tokens.accessToken);
      setUser(userData);
      return userData;
    }
    throw new Error('Invalid authentication response from server');
  };

  /**
   * Logout user and clear tokens
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Backend logout encountered error (clearing local session anyway):', err.message);
    } finally {
      localStorage.removeItem('hms_access_token');
      localStorage.removeItem('hms_user');
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
    verifyAuth,
    isAdmin: user?.role === 'ADMIN',
    isDoctor: user?.role === 'DOCTOR',
    isPatient: user?.role === 'PATIENT',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
