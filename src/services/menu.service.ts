import { apiClient } from "@/lib/api";

const getHeaders = (restaurantId?: string) => {
  return restaurantId ? { headers: { "x-restaurant-id": restaurantId } } : {};
};

export interface Category {
  _id: string;
  name: string;
  description?: string;
  restaurantId: string;
  isActive: boolean;
  createdAt: string;
}

export interface ModifierOption {
  _id?: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

export interface ModifierGroup {
  _id?: string;
  name: string;
  minSelection: number;
  maxSelection: number;
  options: ModifierOption[];
}

export interface Variant {
  name: string;
  price: number;
  sku?: string;
  _id?: string;
}

export interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  categoryId: string | Category;
  restaurantId: string;
  variants: Variant[];
  modifierGroups?: ModifierGroup[];
  station: "BAR" | "TANDOOR" | "GRILL" | "MAIN_KITCHEN" | "BAKERY" | "COLD_KITCHEN" | "OVEN";
  taxPercentage: number;
  isVeg: boolean;
  isAvailable: boolean;
  isActive: boolean;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  shortCode?: string | null;
  numericCode?: string | null;
  createdAt: string;
}

export const menuService = {
  // --- CATEGORIES ---
  async getCategories(restaurantId?: string) {
    const response = await apiClient.get("/restaurant/categories", getHeaders(restaurantId));
    return response.data;
  },

  async createCategory(data: { name: string; description?: string }, restaurantId?: string) {
    const response = await apiClient.post("/restaurant/categories", data, getHeaders(restaurantId));
    return response.data;
  },

  async updateCategory(id: string, data: any, restaurantId?: string) {
    const response = await apiClient.put(`/restaurant/categories/${id}`, data, getHeaders(restaurantId));
    return response.data;
  },

  async deleteCategory(id: string, restaurantId?: string) {
    const response = await apiClient.delete(`/restaurant/categories/${id}`, getHeaders(restaurantId));
    return response.data;
  },

  // --- MENU ITEMS ---
  async getMenuItems(restaurantId?: string) {
    const url = restaurantId ? `/restaurant/menu-items?restaurantId=${restaurantId}` : "/restaurant/menu-items";
    const response = await apiClient.get(url, getHeaders(restaurantId));
    return response.data;
  },

  async createMenuItem(data: any, restaurantId?: string) {
    const response = await apiClient.post("/restaurant/menu-items", data, getHeaders(restaurantId));
    return response.data;
  },

  async updateMenuItem(id: string, data: any, restaurantId?: string) {
    const response = await apiClient.put(`/restaurant/menu-items/${id}`, data, getHeaders(restaurantId));
    return response.data;
  },

  async deleteMenuItem(id: string, restaurantId?: string) {
    const response = await apiClient.delete(`/restaurant/menu-items/${id}`, getHeaders(restaurantId));
    return response.data;
  },

  async uploadMenuItemImage(id: string, file: File, restaurantId?: string) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await apiClient.post(
      `/restaurant/menu-items/${id}/image`,
      formData,
      getHeaders(restaurantId)
    );
    return response.data;
  },

  async removeMenuItemImage(id: string, restaurantId?: string) {
    const response = await apiClient.delete(
      `/restaurant/menu-items/${id}/image`,
      getHeaders(restaurantId)
    );
    return response.data;
  },

  // --- BULK IMPORT ---
  async downloadBulkTemplate(restaurantId?: string): Promise<Blob> {
    const response = await apiClient.get("/restaurant/menu-items/bulk/template", {
      responseType: "blob",
      ...getHeaders(restaurantId),
    });
    return response.data;
  },

  async validateBulk(file: File, restaurantId?: string) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(
      "/restaurant/menu-items/bulk/validate",
      formData,
      getHeaders(restaurantId)
    );
    return response.data;
  },

  async importBulk(file: File, restaurantId?: string) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(
      "/restaurant/menu-items/bulk/import",
      formData,
      getHeaders(restaurantId)
    );
    return response.data;
  },

  async downloadErrorReport(importId: string): Promise<Blob> {
    const response = await apiClient.get(
      `/restaurant/menu-items/bulk/error-report/${importId}`,
      { responseType: "blob" }
    );
    return response.data;
  },
};
