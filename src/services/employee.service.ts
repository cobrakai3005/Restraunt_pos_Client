import { apiClient } from "@/lib/api";

export interface CreateOrderPayload {
  tableId?: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  customerDetails?: {
    name?: string;
    phone?: string;
  };
}

export interface AddKotPayload {
  station: string;
  items: {
    menuItemId: string;
    variantName: string;
    quantity: number;
    notes?: string;
  }[];
}

export const employeeService = {
  // ----------------------------------------
  // MENUS & TABLES (Restaurant Module)
  // ----------------------------------------
  async getCategories() {
    const response = await apiClient.get("/restaurant/categories");
    return response.data;
  },

  async getMenuItems() {
    const response = await apiClient.get("/restaurant/menu-items");
    return response.data;
  },

  async getTables() {
    const response = await apiClient.get("/restaurant/tables");
    return response.data;
  },

  // ----------------------------------------
  // ORDERS & KOTs (Order Module)
  // ----------------------------------------
  async createOrder(data: CreateOrderPayload) {
    const response = await apiClient.post("/orders", data);
    return response.data;
  },

  async addKot(orderId: string, data: AddKotPayload) {
    const response = await apiClient.post(`/orders/${orderId}/kot`, data);
    return response.data;
  },

  async getOrders(params?: Record<string, any>) {
    const response = await apiClient.get("/orders", { params });
    return response.data;
  },

  async getOrderById(orderId: string) {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  async updateKotItemStatus(orderId: string, itemId: string, itemStatus: string) {
    const response = await apiClient.patch(`/orders/${orderId}/items/${itemId}/status`, { itemStatus });
    return response.data;
  },

  // ----------------------------------------
  // BILLING (Order Module)
  // ----------------------------------------
  async generateBill(orderId: string) {
    const response = await apiClient.post(`/orders/${orderId}/bill`);
    return response.data;
  },

  async checkoutOrder(orderId: string, paymentDetails: any) {
    const response = await apiClient.post(`/orders/${orderId}/checkout`, paymentDetails);
    return response.data;
  }
};
