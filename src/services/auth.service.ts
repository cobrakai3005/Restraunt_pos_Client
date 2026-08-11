import { apiClient } from "@/lib/api";

export interface User {
  _id: string;
  contactName?: string;
  username: string;
  email: string;
  role: string;
  clientId?: string;
  restaurantId?: string;
  restaurant?: {
    name?: string;
    address?: { street?: string; city?: string; state?: string; zipCode?: string; country?: string };
    contact?: { phone?: string; email?: string; managerName?: string };
    compliance?: { gstNumber?: string; fssaiNumber?: string };
  } | null;
}

export const authService = {
  login: async (emailOrUsername: string, password: string) => {
    const response = await apiClient.post("/auth/login", {
      emailOrUsername,
      password,
    });
    return response.data;
  },

  employeeLogin: async (emailOrUsername: string, password: string) => {
    const response = await apiClient.post("/auth/employee-login", {
      emailOrUsername,
      password,
    });
    return response.data;
  },
  clientLogin: async (emailOrUsername: string, password: string) => {
    const response = await apiClient.post("/auth/client-login", {
      emailOrUsername,
      password,
    });
    return response.data;
  },

  posLogin: async (restaurantId: string, posPin: string) => {
    const response = await apiClient.post("/auth/pos-login", {
      restaurantId,
      posPin,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data.data as User;
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout API failed", error);
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("vinimay_token");
      // Keep vinimay_restaurant_id so the PIN login can pre-fill the restaurant without re-typing it.
    }
  },
};
