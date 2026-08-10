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
  notes?: string;
}

export interface OrderKOT {
  _id: string;
  kotNumber: number;
  createdBy: string;
  items: OrderItem[];
  createdAt: string;
}

export interface Order {
  _id: string;
  restaurantId: string;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  tableId?: string;
  status: 'OPEN' | 'BILLED' | 'PAID' | 'CANCELLED';
  customerDetails: {
    name: string;
    phone: string;
  };
  kots: OrderKOT[];
  financials: {
    subtotal: number;
    totalCgst: number;
    totalSgst: number;
    totalTax: number;
    packagingCharge: number;
    discount: number;
    grandTotal: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const orderService = {
  getOrders: async (restaurantId: string) => {
    const response = await api.get(`/client/restaurants/${restaurantId}/orders`);
    return response.data;
  },

  getOrderById: async (restaurantId: string, orderId: string) => {
    const response = await api.get(`/client/restaurants/${restaurantId}/orders/${orderId}`);
    return response.data;
  },
  
  createOrder: async (restaurantId: string, data: any) => {
    const response = await api.post(`/client/restaurants/${restaurantId}/orders`, data);
    return response.data;
  },

  getBilledOrders: async (restaurantId: string) => {
    const response = await api.get("/orders", {
      params: { status: "BILLED" },
      headers: { "x-restaurant-id": restaurantId },
    });
    return response.data;
  },

  createInvoice: async (restaurantId: string, orderId: string) => {
    const response = await api.post(`/orders/${orderId}/invoice`, {}, {
      headers: { "x-restaurant-id": restaurantId },
    });
    return response.data;
  },

  checkoutOrder: async (restaurantId: string, orderId: string, method: "CASH" | "UPI" | "CARD", amount: number) => {
    const response = await api.post(`/orders/${orderId}/checkout`, {
      payments: [{ method, amount }],
    }, {
      headers: { "x-restaurant-id": restaurantId },
    });
    return response.data;
  },
};
