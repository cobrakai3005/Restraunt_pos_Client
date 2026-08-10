import { apiClient } from "@/lib/api";

export const adminService = {
  // --- CLIENTS ---
  createClient: async (data: any) => {
    const response = await apiClient.post("/admin/clients", data);
    return response.data;
  },
  getAllClients: async (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await apiClient.get(`/admin/clients${params}`);
    return response.data;
  },
  getClientById: async (id: string) => {
    const response = await apiClient.get(`/admin/clients/${id}`);
    return response.data;
  },
  updateClient: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/clients/${id}`, data);
    return response.data;
  },
  deleteClient: async (id: string) => {
    const response = await apiClient.delete(`/admin/clients/${id}`);
    return response.data;
  },

  // --- MASTER USERS ---
  createMasterUser: async (data: any) => {
    const response = await apiClient.post("/admin/master-users", data);
    return response.data;
  },
  getAllMasterUsers: async () => {
    const response = await apiClient.get("/admin/master-users");
    return response.data;
  },
  getMasterUserById: async (id: string) => {
    const response = await apiClient.get(`/admin/master-users/${id}`);
    return response.data;
  },
  updateMasterUser: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/master-users/${id}`, data);
    return response.data;
  },
  deleteMasterUser: async (id: string) => {
    const response = await apiClient.delete(`/admin/master-users/${id}`);
    return response.data;
  },

  // --- RESTAURANTS ---
  createRestaurant: async (data: any) => {
    const response = await apiClient.post("/admin/restaurants", data);
    return response.data;
  },
  getAllRestaurants: async (search?: string) => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await apiClient.get(`/admin/restaurants${params}`);
    return response.data;
  },
  updateRestaurant: async (id: string, data: any) => {
    const response = await apiClient.put(`/admin/restaurants/${id}`, data);
    return response.data;
  },
  deleteRestaurant: async (id: string) => {
    const response = await apiClient.delete(`/admin/restaurants/${id}`);
    return response.data;
  },
};
