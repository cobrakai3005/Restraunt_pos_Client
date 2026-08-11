import { apiClient } from "@/lib/api";

export const restaurantService = {
  // --- CATEGORIES ---
  getCategories: async (restaurantId: string, params?: Record<string, any>) => {
    const res = await apiClient.get("/restaurant/categories", { headers: { "x-restaurant-id": restaurantId }, params });
    return res.data;
  },
  createCategory: async (restaurantId: string, data: any) => {
    const res = await apiClient.post("/restaurant/categories", data, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },
  updateCategory: async (restaurantId: string, id: string, data: any) => {
    const res = await apiClient.put(`/restaurant/categories/${id}`, data, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },
  deleteCategory: async (restaurantId: string, id: string) => {
    const res = await apiClient.delete(`/restaurant/categories/${id}`, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },

  // --- MENU ITEMS ---
  getMenuItems: async (restaurantId: string, params?: Record<string, any>) => {
    const res = await apiClient.get("/restaurant/menu-items", { headers: { "x-restaurant-id": restaurantId }, params });
    return res.data;
  },
  createMenuItem: async (restaurantId: string, data: any) => {
    const res = await apiClient.post("/restaurant/menu-items", data, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },
  updateMenuItem: async (restaurantId: string, id: string, data: any) => {
    const res = await apiClient.put(`/restaurant/menu-items/${id}`, data, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },
  deleteMenuItem: async (restaurantId: string, id: string) => {
    const res = await apiClient.delete(`/restaurant/menu-items/${id}`, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },

  // --- TABLES ---
  getTables: async (restaurantId: string, params?: Record<string, any>) => {
    const res = await apiClient.get("/restaurant/tables", { headers: { "x-restaurant-id": restaurantId }, params });
    return res.data;
  },
  createTable: async (restaurantId: string, data: any) => {
    const res = await apiClient.post("/restaurant/tables", data, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },
  updateTable: async (restaurantId: string, id: string, data: any) => {
    const res = await apiClient.put(`/restaurant/tables/${id}`, data, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },
  deleteTable: async (restaurantId: string, id: string) => {
    const res = await apiClient.delete(`/restaurant/tables/${id}`, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },

  // --- ORDERS (live ops for the restaurant overview) ---
  getOrders: async (restaurantId: string, params?: Record<string, any>) => {
    const res = await apiClient.get("/restaurant/orders", { headers: { "x-restaurant-id": restaurantId }, params });
    return res.data;
  },
};
