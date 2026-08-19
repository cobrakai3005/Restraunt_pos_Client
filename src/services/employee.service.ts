import { apiClient } from "@/lib/api";

export interface CreateOrderPayload {
  tableId?: string;
  orderType: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  guestCount?: number;
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
  },

  async updateCustomer(
    orderId: string,
    data: {
      name?: string;
      phone?: string;
      customerId?: string | null;
      discount?: number;
      discountType?: "NONE" | "PERCENTAGE" | "FIXED" | "MANUAL";
      discountValue?: number;
      discountReason?: string;
    }
  ) {
    const response = await apiClient.patch(`/orders/${orderId}/customer`, data);
    return response.data;
  },

  async reopenOrder(orderId: string) {
    const response = await apiClient.post(`/orders/${orderId}/reopen`);
    return response.data;
  },

  async toggleComplimentaryItem(
    orderId: string,
    itemId: string,
    data: { isComplimentary: boolean; complimentaryReason?: string }
  ) {
    const response = await apiClient.patch(`/orders/${orderId}/items/${itemId}/complimentary`, data);
    return response.data;
  },


  async addDuePayment(
    orderId: string,
    data: {
      amount?: number;
      method?: "CASH" | "UPI" | "CARD" | "OTHER";
      payments?: Array<{ amount: number; method: "CASH" | "UPI" | "CARD" | "OTHER" }>;
      notes?: string;
    }
  ) {
    const response = await apiClient.post(`/orders/${orderId}/due-payments`, data);
    return response.data;
  },

  async getCustomerDueSummary(customerId: string) {
    const response = await apiClient.get(`/orders/customer-dues/${customerId}`);
    return response.data;
  },

  async getEmployees() {
    try {
      const response = await apiClient.get("/client/employees");
      return response.data;
    } catch {
      const response = await apiClient.get("/employees");
      return response.data;
    }
  },

  async getAnalytics(params?: Record<string, any>) {
    const response = await apiClient.get("/analytics/dashboard", { params });
    return response.data;
  },

  // ----------------------------------------
  // TABLE MERGE & UNMERGE (Order Module)
  // ----------------------------------------
  async checkMergeConflicts(tableIds: string[]) {
    const response = await apiClient.post("/orders/check-merge-conflicts", { tableIds });
    return response.data;
  },

  async mergeTables(data: {
    primaryTableId: string;
    secondaryTableIds: string[];
    resolvedCustomerDetails?: {
      name?: string;
      phone?: string;
      customerId?: string | null;
    };
    resolvedDiscount?: {
      discountType?: "NONE" | "PERCENTAGE" | "FIXED" | "MANUAL";
      discountValue?: number;
      discountReason?: string;
    };
    guestCount?: number;
  }) {
    const response = await apiClient.post("/orders/merge-tables", data);
    return response.data;
  },

  async unmergeTables(data: {
    orderId: string;
    unmergeTableId: string;
    itemSelections?: Array<{
      kotId: string;
      itemId: string;
      quantity: number;
    }>;
    wholeKotIds?: string[];
    unmergedGuestCount?: number;
  }) {
    const response = await apiClient.post("/orders/unmerge-tables", data);
    return response.data;
  },
};
