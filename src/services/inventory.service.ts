import { apiClient } from "@/lib/api";

export interface InventoryItem {
  _id: string;
  restaurantId: string;
  name: string;
  unit: "KG" | "LITRE" | "GRAM" | "ML" | "PCS";
  currentStock: number;
  reorderLevel: number;
  costPerUnit: number;
  preferredVendorId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInventoryItemPayload {
  name: string;
  unit: "KG" | "LITRE" | "GRAM" | "ML" | "PCS";
  currentStock?: number;
  reorderLevel?: number;
  costPerUnit?: number;
  preferredVendorId?: string;
  isActive?: boolean;
  restaurantIds?: string[];
}

const getHeaders = (restaurantId?: string) => {
  return restaurantId ? { headers: { "x-restaurant-id": restaurantId } } : {};
};

export const inventoryService = {
  async getInventoryItems(restaurantId?: string, params?: Record<string, any>) {
    const url = restaurantId ? `/inventory?restaurantId=${restaurantId}` : "/inventory";
    const response = await apiClient.get(url, { ...getHeaders(restaurantId), params });
    return response.data;
  },

  async getInventoryItemById(id: string, restaurantId?: string) {
    const response = await apiClient.get(`/inventory/${id}`, getHeaders(restaurantId));
    return response.data;
  },

  async createInventoryItem(data: CreateInventoryItemPayload, restaurantId?: string) {
    // If restaurantIds array is provided, backend handles bulk create. 
    // If not, it uses x-restaurant-id header or JWT.
    const response = await apiClient.post("/inventory", data, getHeaders(restaurantId));
    return response.data;
  },

  async updateInventoryItem(id: string, data: Partial<CreateInventoryItemPayload>, restaurantId?: string) {
    const response = await apiClient.patch(`/inventory/${id}`, data, getHeaders(restaurantId));
    return response.data;
  },

  async deleteInventoryItem(id: string, restaurantId?: string) {
    const response = await apiClient.delete(`/inventory/${id}`, getHeaders(restaurantId));
    return response.data;
  }
};
