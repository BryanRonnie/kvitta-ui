"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserResponse } from "../types/auth";

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: UserResponse, rememberMe: boolean) => void;
  logout: () => void;
  clearSession: () => void;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const REMEMBER_ME_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize session from localStorage
  useEffect(() => {
    const initSession = () => {
      if (typeof window === "undefined") return;

      const savedUser = localStorage.getItem("auth_user");
      const rememberMe = localStorage.getItem("remember_me") === "true";
      const lastActivityTime = localStorage.getItem("last_activity");

      if (savedUser && lastActivityTime) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivityTime);
        const timeout = rememberMe ? REMEMBER_ME_TIMEOUT : SESSION_TIMEOUT;

        if (timeSinceLastActivity < timeout) {
          setUser(JSON.parse(savedUser));
          scheduleSessionTimeout(timeout - timeSinceLastActivity, rememberMe);
        } else {
          clearSession();
        }
      }

      setIsLoading(false);
    };

    initSession();
  }, []);

  // Track user activity
  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      if (typeof window === "undefined") return;
      localStorage.setItem("last_activity", Date.now().toString());

      const rememberMe = localStorage.getItem("remember_me") === "true";
      const timeout = rememberMe ? REMEMBER_ME_TIMEOUT : SESSION_TIMEOUT;
      scheduleSessionTimeout(timeout, rememberMe);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user]);

  const scheduleSessionTimeout = useCallback((timeout: number, rememberMe: boolean) => {
    if (sessionTimeout) clearTimeout(sessionTimeout);

    const newTimeout = setTimeout(() => {
      clearSession();
    }, timeout);

    setSessionTimeout(newTimeout);
  }, [sessionTimeout]);

  const clearSession = useCallback(() => {
    if (typeof window === "undefined") return;
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("remember_me");
    localStorage.removeItem("last_activity");
    localStorage.removeItem("access_token");
    if (sessionTimeout) clearTimeout(sessionTimeout);
    window.location.href = "/login";
  }, [sessionTimeout]);

  const login = useCallback((userData: UserResponse, rememberMe: boolean) => {
    if (typeof window === "undefined") return;
    
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
    localStorage.setItem("remember_me", rememberMe.toString());
    localStorage.setItem("last_activity", Date.now().toString());

    const timeout = rememberMe ? REMEMBER_ME_TIMEOUT : SESSION_TIMEOUT;
    scheduleSessionTimeout(timeout, rememberMe);
  }, [scheduleSessionTimeout]);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
