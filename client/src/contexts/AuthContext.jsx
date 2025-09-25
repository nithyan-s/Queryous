import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// API base URL - use environment variable
const API_BASE = import.meta.env.VITE_API_URL || 'https://queryous-3.onrender.com';

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

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
          logout();
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { access_token, user: userData } = response.data;
      
      // Store token and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed'
      };
    }
  };

  const signup = async (username, password) => {
    try {
      const response = await api.post('/auth/signup', { username, password });
      const { access_token, user: userData } = response.data;
      
      // Store token and user data
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Signup failed'
      };
    }
  };

  const storeDbCredentials = async (credentials) => {
    try {
      await api.post('/auth/store-db-credentials', credentials);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to store database credentials'
      };
    }
  };

  const getDbCredentials = async () => {
    try {
      const response = await api.get('/auth/get-db-credentials');
      return { success: true, data: response.data };
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, data: null }; // No credentials stored yet
      }
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to retrieve database credentials'
      };
    }
  };

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to get user profile'
      };
    }
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    
    setUser(null);
    
    // Optionally call logout endpoint
    api.post('/auth/logout').catch(() => {
      // Ignore errors on logout
    });
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('access_token');
  };

  const value = {
    user,
    loading,
    login,
    signup,
    storeDbCredentials,
    getDbCredentials,
    getCurrentUser,
    logout,
    isAuthenticated,
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
