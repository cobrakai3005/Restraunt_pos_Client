import { apiClient } from "@/lib/api";

const getHeaders = (restaurantId?: string) => {
  return restaurantId ? { headers: { "x-restaurant-id": restaurantId } } : {};
};

export interface PurchaseItem {
  inventoryItemId: string | any;
  quantity: number;
  ratePerUnit: number;
  totalAmount: number;
}

export interface PurchaseInvoice {
  _id: string;
  restaurantId: string;
  vendorName: string; // The ID of the vendor or name
  vendorGst?: string;
  invoiceNumber: string;
  items: PurchaseItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod?: "Cash" | "Credit" | "UPI" | "Bank Transfer" | "Cheque" | "Others";
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  invoiceDate: string;
  createdAt: string;
}

export const purchaseService = {
  async getPurchases(restaurantId?: string) {
    const response = await apiClient.get("/purchases", getHeaders(restaurantId));
    return response.data;
  },

  async createPurchase(data: Partial<PurchaseInvoice>, restaurantId?: string) {
    const response = await apiClient.post("/purchases", data, getHeaders(restaurantId));
    return response.data;
  },
};
