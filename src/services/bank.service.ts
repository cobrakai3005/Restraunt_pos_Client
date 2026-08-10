import { apiClient } from "@/lib/api";

export interface BankDetail {
  _id: string;
  restaurantId: string;
  companyId: string | { _id: string; name: string };
  bankName: string;
  city?: string;
  accountNumber: string;
  ifscCode: string;
  branchAddress?: string;
  upiId?: string;
  upiName?: string;
  upiMobile?: string;
  qrCodeUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const getHeaders = (restaurantId?: string) => {
  return restaurantId ? { headers: { "x-restaurant-id": restaurantId } } : {};
};

export const bankService = {
  getBankDetails: async (query?: { companyId?: string }, restaurantId?: string) => {
    const config: any = getHeaders(restaurantId);
    if (query) {
      config.params = query;
    }
    const res = await apiClient.get<{ success: boolean; data: BankDetail[] }>("/banks", config);
    return res.data;
  },

  getBankDetailById: async (id: string, restaurantId?: string) => {
    const res = await apiClient.get<{ success: boolean; data: BankDetail }>(`/banks/${id}`, getHeaders(restaurantId));
    return res.data;
  },

  createBankDetail: async (data: Partial<BankDetail>, restaurantId?: string) => {
    const res = await apiClient.post<{ success: boolean; data: BankDetail; message: string }>("/banks", data, getHeaders(restaurantId));
    return res.data;
  },

  updateBankDetail: async (id: string, data: Partial<BankDetail>, restaurantId?: string) => {
    const res = await apiClient.put<{ success: boolean; data: BankDetail; message: string }>(`/banks/${id}`, data, getHeaders(restaurantId));
    return res.data;
  },

  deleteBankDetail: async (id: string, restaurantId?: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/banks/${id}`, getHeaders(restaurantId));
    return res.data;
  },
};
