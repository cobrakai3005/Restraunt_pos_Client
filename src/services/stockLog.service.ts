import { apiClient } from "@/lib/api";

export interface StockLog {
  _id: string;
  restaurantId: string;
  inventoryItemId: string;
  type: "PURCHASE" | "POS_CONSUMPTION" | "WASTAGE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "RETURN_TO_VENDOR";
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  costPerUnit: number;
  totalValue: number;
  reason: string;
  notes?: string;
  referenceId?: string;
  performedBy?: {
    _id: string;
    contactName: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface WastageSummary {
  breakdown: Array<{
    _id: string; // Reason
    totalEvents: number;
    totalLossValue: number;
  }>;
  totalLoss: number;
  totalEvents: number;
}

const getHeaders = (restaurantId?: string) => {
  return restaurantId ? { headers: { "x-restaurant-id": restaurantId } } : {};
};

export const stockLogService = {
  adjustStock: async (
    itemId: string,
    data: {
      type: "WASTAGE" | "ADJUSTMENT_IN" | "ADJUSTMENT_OUT" | "RETURN_TO_VENDOR";
      quantity: number;
      unit?: string;
      reason?: string;
      notes?: string;
    },
    restaurantId?: string
  ) => {
    const res = await apiClient.post(`/inventory/${itemId}/adjust`, data, getHeaders(restaurantId));
    return res.data;
  },

  getItemHistory: async (itemId: string, restaurantId?: string, params?: Record<string, any>) => {
    const res = await apiClient.get(`/inventory/${itemId}/history`, {
      ...getHeaders(restaurantId),
      params,
    });
    return res.data;
  },

  getWastageSummary: async (restaurantId?: string, params?: Record<string, any>) => {
    const res = await apiClient.get("/inventory/wastage-summary", {
      ...getHeaders(restaurantId),
      params,
    });
    return res.data;
  },

  reconcilePhysicalStock: async (
    items: Array<{ inventoryItemId: string; physicalCount: number; notes?: string }>,
    restaurantId?: string
  ) => {
    const res = await apiClient.post("/inventory/reconcile", { items }, getHeaders(restaurantId));
    return res.data;
  },
};
