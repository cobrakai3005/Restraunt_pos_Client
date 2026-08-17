import { apiClient as api } from "@/lib/api";

export interface OrderItem {
  menuItemId: string;
  variantName: string;
  variantPrice: number;
  quantity: number;
  taxPercentage: number;
  cgstPercent: number;
  sgstPercent: number;
  station: string;
  itemStatus: string;
  isComplimentary?: boolean;
  complimentaryReason?: string;
  notes?: string;
}

export interface OrderKOT {
  _id: string;
  kotNumber: number;
  createdBy: string;
  items: OrderItem[];
  createdAt: string;
}

export interface DuePaymentRecord {
  _id?: string;
  amount: number;
  method: "CASH" | "UPI" | "CARD" | "OTHER";
  receivedBy: {
    _id?: string;
    contactName?: string;
    role?: string;
  } | string;
  receivedAt: string;
  notes?: string;
  transactionId?: string;
}

export interface Order {
  _id: string;
  restaurantId: string;
  orderType: "DINE_IN" | "TAKEAWAY";
  tableId?: any;
  status: "OPEN" | "BILLED" | "PAID" | "CANCELLED";
  customerDetails: {
    name: string;
    phone: string;
    customerId?: any;
  };
  kots: OrderKOT[];
  financials: {
    subtotal: number;
    totalCgst: number;
    totalSgst: number;
    totalTax: number;
    packagingCharge: number;
    discount: number;
    discountType?: "NONE" | "PERCENTAGE" | "FIXED" | "MANUAL";
    discountValue?: number;
    discountReason?: string;
    grandTotal: number;
    paidAmount?: number;
    dueAmount?: number;
    dueStatus?: "NONE" | "PARTIAL" | "PENDING" | "PAID";
    payments?: Array<{ method: string; amount: number }>;
    duePayments?: DuePaymentRecord[];
  };
  cashierId?: any;
  waiterId?: any;
  invoiceId?: any;
  createdAt: string;
  updatedAt: string;
}

export const orderService = {
  getOrders: async (restaurantId: string) => {
    const response = await api.get(`/client/restaurants/${restaurantId}/orders`);
    return response.data;
  },

  getOrderById: async (restaurantId: string, orderId: string) => {
    const response = await api.get(`/orders/${orderId}`, {
      headers: { "x-restaurant-id": restaurantId },
    });
    return response.data;
  },

  createOrder: async (restaurantId: string, data: any) => {
    const response = await api.post(`/orders`, data, {
      headers: { "x-restaurant-id": restaurantId },
    });
    return response.data;
  },

  getBilledOrders: async (restaurantId: string) => {
    const response = await api.get("/orders", {
      params: { status: "BILLED" },
      headers: { "x-restaurant-id": restaurantId },
    });
    return response.data;
  },

  getSettlementOrders: async (restaurantId: string) => {
    const headers = { headers: { "x-restaurant-id": restaurantId } };
    const [openResponse, billedResponse] = await Promise.all([
      api.get("/orders", { params: { status: "OPEN" }, ...headers }),
      api.get("/orders", { params: { status: "BILLED" }, ...headers }),
    ]);
    const getList = (response: any) =>
      Array.isArray(response.data) ? response.data : response.data?.data || [];
    return [...getList(openResponse), ...getList(billedResponse)];
  },

  generateBill: async (restaurantId: string, orderId: string) => {
    const response = await api.post(
      `/orders/${orderId}/bill`,
      {},
      {
        headers: { "x-restaurant-id": restaurantId },
      }
    );
    return response.data;
  },

  createInvoice: async (restaurantId: string, orderId: string) => {
    const response = await api.post(
      `/orders/${orderId}/invoice`,
      {},
      {
        headers: { "x-restaurant-id": restaurantId },
      }
    );
    return response.data;
  },

  checkoutOrder: async (
    restaurantId: string,
    orderId: string,
    payments: Array<{ method: string; amount: number }>
  ) => {
    const response = await api.post(
      `/orders/${orderId}/checkout`,
      { payments },
      {
        headers: { "x-restaurant-id": restaurantId },
      }
    );
    return response.data;
  },

  addDuePayment: async (
    restaurantId: string,
    orderId: string,
    paymentData: {
      amount?: number;
      method?: "CASH" | "UPI" | "CARD" | "OTHER";
      payments?: Array<{ amount: number; method: "CASH" | "UPI" | "CARD" | "OTHER" }>;
      notes?: string;
    }
  ) => {
    const response = await api.post(`/orders/${orderId}/due-payments`, paymentData, {
      headers: { "x-restaurant-id": restaurantId },
    });
    return response.data;
  },

  getDueOrders: async (restaurantId: string, params: any = {}) => {
    const response = await api.get(`/orders/dues`, {
      params: { ...params, restaurantId },
      headers: { "x-restaurant-id": restaurantId },
    });
    return response.data;
  },

  getCustomerDueSummary: async (restaurantId: string, customerId: string) => {
    const response = await api.get(`/orders/customer-dues/${customerId}`, {
      params: { restaurantId },
      headers: { "x-restaurant-id": restaurantId },
    });
    return response.data;
  },
};
