import { apiClient } from "@/lib/api";

export const clientService = {
  // --- RESTAURANTS ---
  getRestaurants: async () => {
    const res = await apiClient.get("/client/restaurants");
    return res.data;
  },
  getRestaurantById: async (id: string) => {
    const res = await apiClient.get(`/client/restaurants/${id}`);
    return res.data;
  },
  createRestaurant: async (data: { name: string }) => {
    const res = await apiClient.post("/client/restaurants", data);
    return res.data;
  },
  updateRestaurant: async (id: string, data: any) => {
    const res = await apiClient.put(`/client/restaurants/${id}`, data);
    return res.data;
  },
  deleteRestaurant: async (id: string) => {
    const res = await apiClient.delete(`/client/restaurants/${id}`);
    return res.data;
  },

  // --- EMPLOYEES ---
  getEmployees: async () => {
    const res = await apiClient.get("/client/employees");
    return res.data;
  },
  getEmployeeById: async (id: string) => {
    const res = await apiClient.get(`/client/employees/${id}`);
    return res.data;
  },
  createEmployee: async (data: any) => {
    const res = await apiClient.post("/client/employees", data);
    return res.data;
  },
  updateEmployee: async (id: string, data: any) => {
    const res = await apiClient.put(`/client/employees/${id}`, data);
    return res.data;
  },
  deleteEmployee: async (id: string) => {
    const res = await apiClient.delete(`/client/employees/${id}`);
    return res.data;
  },
};
