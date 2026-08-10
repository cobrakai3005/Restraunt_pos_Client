import { apiClient } from "@/lib/api";

const getHeaders = (restaurantId?: string) => {
  return restaurantId ? { headers: { "x-restaurant-id": restaurantId } } : {};
};

export interface Vendor {
  _id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  restaurantId: string;
  isActive: boolean;
  createdAt: string;
}

export const vendorService = {
  async getVendors(restaurantId?: string) {
    const response = await apiClient.get("/vendors", getHeaders(restaurantId));
    return response.data;
  },

  async createVendor(data: Partial<Vendor>, restaurantId?: string) {
    const response = await apiClient.post("/vendors", data, getHeaders(restaurantId));
    return response.data;
  },

  async updateVendor(id: string, data: Partial<Vendor>, restaurantId?: string) {
    const response = await apiClient.put(`/vendors/${id}`, data, getHeaders(restaurantId));
    return response.data;
  },

  async deleteVendor(id: string, restaurantId?: string) {
    const response = await apiClient.delete(`/vendors/${id}`, getHeaders(restaurantId));
    return response.data;
  },
};
