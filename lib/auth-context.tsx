/**
 * Authentication Context
 * 
 * Manages user authentication state and session persistence.
 * Uses localStorage for "remember me" functionality.
 * Integrates with kvitta-api backend for JWT-based authentication.
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AUTH_COOKIE = 'kvitta_token';
const REMEMBER_COOKIE = 'kvitta_remember';
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const getCookieAttributes = (maxAge?: number) => {
  const base = ['Path=/', 'SameSite=Lax'];
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    base.push('Secure');
  }
  if (maxAge) {
    base.push(`Max-Age=${maxAge}`);
  }
  return base.join('; ');
};

const setAuthCookie = (tokenValue: string, rememberMe: boolean) => {
  const tokenAttrs = getCookieAttributes(rememberMe ? REMEMBER_MAX_AGE : undefined);
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(tokenValue)}; ${tokenAttrs}`;
  const rememberAttrs = getCookieAttributes(rememberMe ? REMEMBER_MAX_AGE : undefined);
  document.cookie = `${REMEMBER_COOKIE}=${rememberMe ? '1' : '0'}; ${rememberAttrs}`;
};

const clearAuthCookie = () => {
  const expiredAttrs = 'Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = `${AUTH_COOKIE}=; ${expiredAttrs}`;
  document.cookie = `${REMEMBER_COOKIE}=; ${expiredAttrs}`;
};

interface User {
  email: string;
  name?: string;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const sessionToken = sessionStorage.getItem('token');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    const activeToken = (storedToken && rememberMe) ? storedToken : sessionToken;
    
    if (activeToken) {
      setToken(activeToken);
      // Verify token and get user info
      verifyAndLoadUser(activeToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyAndLoadUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        clearAuth();
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    clearAuthCookie();
  };

  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      const { access_token, user: userData } = data;

      setUser(userData);
      setToken(access_token);

      // Store token based on remember me preference
      if (rememberMe) {
        localStorage.setItem('token', access_token);
        localStorage.setItem('rememberMe', 'true');
      } else {
        sessionStorage.setItem('token', access_token);
        localStorage.removeItem('rememberMe');
      }

      setAuthCookie(access_token, rememberMe);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }

      const data = await response.json();
      const { access_token, user: userData } = data;

      setUser(userData);
      setToken(access_token);

      // Auto-save token on signup (remember me = true)
      localStorage.setItem('token', access_token);
      localStorage.setItem('rememberMe', 'true');

      setAuthCookie(access_token, true);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint (optional, for token blacklisting)
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  const refreshToken = async () => {
    try {
      if (!token) return;

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token, user: userData } = data;

        setUser(userData);
        setToken(access_token);

        // Update stored token
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        if (rememberMe) {
          localStorage.setItem('token', access_token);
        } else {
          sessionStorage.setItem('token', access_token);
        }

        setAuthCookie(access_token, rememberMe);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }
  };

  // Auto-refresh token before expiration (every 25 minutes if token expires in 30)
  useEffect(() => {
    if (!token) return;

    const refreshInterval = setInterval(() => {
      refreshToken();
    }, 25 * 60 * 1000); // 25 minutes

    return () => clearInterval(refreshInterval);
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
