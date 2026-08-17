"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService, User } from "@/services/auth.service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  login: (token: string, user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: () => {},
  login: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getMe();
      setUser(currentUser);
    } catch (error) {
      // We don't log the raw error object here because Next.js dev server 
      // intercepts it and shows a full-screen red error overlay.
      console.warn("Failed to fetch user (e.g. not logged in or token expired)");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Keep user in sync when the token changes (e.g. a login happens in another tab/window)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "vinimay_token" || e.key === "vinimay_role" || e.key === "vinimay_restaurant_id") {
        refreshUser();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshUser]);

  const login = (token: string, loggedInUser: User) => {
    localStorage.setItem("vinimay_token", token);
    if (loggedInUser?.role) {
      localStorage.setItem("vinimay_role", loggedInUser.role);
    }
    setUser(loggedInUser);
    setIsLoading(false);
  };

  const logout = async () => {
    const role = user?.role;
    await authService.logout();
    setUser(null);
    
    if (role && ["CHEF", "WAITER", "MANAGER", "CASHIER", "INVENTORY_MANAGER"].includes(role)) {
      window.location.href = "/employee-login";
    } else {
      window.location.href = "/client-login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, login, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
