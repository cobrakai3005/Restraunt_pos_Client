import { apiClient } from "@/lib/api";

export interface TransactionItem {
  productId?: string;
  productModel?: "InventoryItem" | "MenuItem";
  name?: string;
  quantity?: number;
  unit?: string;
  pricePerUnit?: number;
  hsnCode?: string;
  amount?: number;
}

export interface Transaction {
  _id: string;
  restaurantId: string;
  type: "SALES" | "PURCHASE" | "RECEIPT" | "PAYMENT" | "JOURNAL" | "PROFORMA";
  status: "DRAFT" | "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";
  transactionDate: string;
  dueDate?: string;
  companyId?: string | { _id: string; name: string; type?: string; phone?: string; email?: string; address?: string; contactPerson?: string };
  companyModel?: "Vendor" | "Restaurant";
  companyName?: string;
  customerName?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  items: TransactionItem[];
  paymentMethod?: "Cash" | "Credit" | "UPI" | "Bank Transfer" | "Cheque" | "Others" | "Split" | "Card" | "Complimentary";
  payments?: Array<{ method: string; amount: number; transactionDate?: string }>;
  bank?: string;
  referenceNumber?: string;
  description?: string;
  isExpense: boolean;
  paidAmount: number;
  createdBy: string | { _id: string; contactName: string; role: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const getHeaders = (restaurantId?: string) => {
  return restaurantId ? { headers: { "x-restaurant-id": restaurantId } } : {};
};

export const transactionService = {
  getTransactions: async (
    query?: { type?: string; status?: string; page?: number; limit?: number; search?: string; from?: string; to?: string },
    restaurantId?: string,
  ) => {
    const config: any = getHeaders(restaurantId);
    if (query) {
      config.params = query;
    }
    const res = await apiClient.get<{ success: boolean; data: { data: Transaction[]; meta: PaginationMeta; summary?: { revenue: number } } }>("/transactions", config);
    return res.data;
  },

  getTransactionById: async (id: string, restaurantId?: string) => {
    const res = await apiClient.get<{ success: boolean; data: Transaction }>(`/transactions/${id}`, getHeaders(restaurantId));
    return res.data;
  },

  createTransaction: async (data: Partial<Transaction>, restaurantId?: string) => {
    const res = await apiClient.post<{ success: boolean; data: Transaction; message: string }>("/transactions", data, getHeaders(restaurantId));
    return res.data;
  },

  updateTransaction: async (id: string, data: Partial<Transaction>, restaurantId?: string) => {
    const res = await apiClient.put<{ success: boolean; data: Transaction; message: string }>(`/transactions/${id}`, data, getHeaders(restaurantId));
    return res.data;
  },

  deleteTransaction: async (id: string, restaurantId?: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/transactions/${id}`, getHeaders(restaurantId));
    return res.data;
  },

  getLedger: async (companyId: string, query?: any, restaurantId?: string) => {
    const config: any = getHeaders(restaurantId);
    if (query) config.params = query;
    const res = await apiClient.get<{ success: boolean; data: { closingBalance: number; entries: any[] } }>(`/transactions/ledger/${companyId}`, config);
    return res.data;
  },
};
