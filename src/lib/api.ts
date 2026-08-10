import axios from "axios";
import { toast } from "@/components/ui/use-toast";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || "https://resposbackend.onrender.com"}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the JWT token
apiClient.interceptors.request.use(
  (config) => {
    // In a real app you might want to use cookies or a more secure storage,
    // but localStorage is standard for simple integrations.
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("vinimay_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only run in the browser
    if (typeof window !== "undefined") {
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        "An unexpected error occurred.";
        
      // Don't show toast for silent checks (e.g. initial auth checks if they fail)
      // Or you can show it. It's usually fine to show it unless it gets spammy.
      if (error.response?.status !== 401 || !error.config.url?.includes("/auth/me")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
      }
    }
    return Promise.reject(error);
  }
);



apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    const isTokenExpired =
      status === 401 && String(data?.message || "").includes("Token expired");

    if (isTokenExpired) {
      console.log("Logging out because token expired");

      localStorage.clear();
      sessionStorage.clear();

      window.location.href = "/client-login";

      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);
