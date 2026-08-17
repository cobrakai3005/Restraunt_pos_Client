import { apiClient } from "@/lib/api";

const getHeaders = (restaurantId?: string) => {
  return restaurantId ? { headers: { "x-restaurant-id": restaurantId } } : {};
};

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  tags?: "NORMAL" | "FRIEND" | "VIP" | "STAFF";
  discountType?: "NONE" | "PERCENTAGE" | "FIXED";
  discountValue?: number;
  notes?: string;
  closingBalance?: number;
  outstandingDue?: number;
  dueOrdersCount?: number;
  restaurantId: string;
  isActive: boolean;
  createdAt: string;
}

export const customerService = {
  async getCustomers(restaurantId?: string, params?: { search?: string; phone?: string; tags?: string; isActive?: boolean }) {
    const response = await apiClient.get("/customers", {
      ...getHeaders(restaurantId),
      params,
    });
    return response.data;
  },

  async searchCustomerByPhone(phone: string, restaurantId?: string) {
    const response = await apiClient.get("/customers/search/phone", {
      ...getHeaders(restaurantId),
      params: { phone },
    });
    return response.data;
  },

  async createCustomer(data: Partial<Customer>, restaurantId?: string) {
    const response = await apiClient.post("/customers", data, getHeaders(restaurantId));
    return response.data;
  },

  async updateCustomer(id: string, data: Partial<Customer>, restaurantId?: string) {
    const response = await apiClient.put(`/customers/${id}`, data, getHeaders(restaurantId));
    return response.data;
  },

  async deleteCustomer(id: string, restaurantId?: string) {
    const response = await apiClient.delete(`/customers/${id}`, getHeaders(restaurantId));
    return response.data;
  },
};
