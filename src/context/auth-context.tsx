"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, User } from "@/services/auth.service";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
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
    };

    fetchUser();
  }, []);

  const logout = async () => {
    const role = user?.role;
    await authService.logout();
    setUser(null);
    
    if (role === "SUPER_ADMIN") {
      window.location.href = "/admin-login";
    } else if (role === "CLIENT") {
      window.location.href = "/client-login";
    } else if (role && ["CHEF", "WAITER", "MANAGER", "CASHIER"].includes(role)) {
      window.location.href = "/employee-login";
    } else {
      window.location.href = "/client-login"; 
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
