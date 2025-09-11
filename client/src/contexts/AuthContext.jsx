import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// API base URL
const API_BASE = 'http://localhost:8001';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);
          
          // Retry original request
          original.headers.Authorization = `Bearer ${access_token}`;
          return api(original);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          await loadUserPreferences();
        } catch (error) {
          console.error('Error parsing saved user:', error);
          logout();
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user: userData } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      await loadUserPreferences();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { access_token, refresh_token, user: newUser } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      await loadUserPreferences();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      };
    }
  };

  const loginWithOAuth = async (provider) => {
    try {
      // Get OAuth URL
      const response = await api.get(`/auth/oauth/${provider}`);
      const { auth_url, state } = response.data;
      
      // Store state for verification
      localStorage.setItem('oauth_state', state);
      
      // Redirect to OAuth provider
      window.location.href = auth_url;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'OAuth initialization failed'
      };
    }
  };

  const handleOAuthCallback = async (provider, code, state) => {
    try {
      const savedState = localStorage.getItem('oauth_state');
      if (state !== savedState) {
        throw new Error('Invalid OAuth state');
      }
      
      const response = await api.post(`/auth/oauth/${provider}/callback`, {
        code,
        state
      });
      
      const { access_token, refresh_token, user: userData } = response.data;
      
      // Store tokens and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      await loadUserPreferences();
      
      // Clean up OAuth state
      localStorage.removeItem('oauth_state');
      
      return { success: true };
    } catch (error) {
      localStorage.removeItem('oauth_state');
      return {
        success: false,
        error: error.response?.data?.detail || 'OAuth callback failed'
      };
    }
  };

  const forgotPassword = async (phoneNumber) => {
    try {
      await api.post('/auth/forgot-password', { phone_number: phoneNumber });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to send OTP'
      };
    }
  };

  const resetPassword = async (phoneNumber, otpCode, newPassword) => {
    try {
      await api.post('/auth/reset-password', {
        phone_number: phoneNumber,
        otp_code: otpCode,
        new_password: newPassword
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Password reset failed'
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/me', profileData);
      const updatedUser = response.data;
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Profile update failed'
      };
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await api.get('/auth/preferences');
      setPreferences(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return null;
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      const response = await api.put('/auth/preferences', newPreferences);
      setPreferences(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to update preferences'
      };
    }
  };

  const getUserStats = async () => {
    try {
      const response = await api.get('/auth/stats');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to load stats'
      };
    }
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('oauth_state');
    
    setUser(null);
    setPreferences(null);
    
    // Optionally call logout endpoint
    api.post('/auth/logout').catch(() => {
      // Ignore errors on logout
    });
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('access_token');
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Basic permission checks
    switch (permission) {
      case 'premium':
        return user.is_premium;
      case 'verified_email':
        return user.is_email_verified;
      case 'verified_phone':
        return user.is_phone_verified;
      default:
        return true;
    }
  };

  const value = {
    user,
    preferences,
    loading,
    login,
    register,
    loginWithOAuth,
    handleOAuthCallback,
    forgotPassword,
    resetPassword,
    updateProfile,
    loadUserPreferences,
    updatePreferences,
    getUserStats,
    logout,
    isAuthenticated,
    hasPermission,
    api // Expose API instance for other components
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
