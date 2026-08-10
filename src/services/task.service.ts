import { apiClient } from "@/lib/api";

export const taskService = {
  getTasks: async (restaurantId: string) => {
    const res = await apiClient.get("/tasks", { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },
  createTask: async (restaurantId: string, data: any) => {
    const res = await apiClient.post("/tasks", data, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },
  updateTask: async (restaurantId: string, id: string, data: any) => {
    const res = await apiClient.patch(`/tasks/${id}`, data, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  },
  deleteTask: async (restaurantId: string, id: string) => {
    const res = await apiClient.delete(`/tasks/${id}`, { headers: { "x-restaurant-id": restaurantId } });
    return res.data;
  }
};
