import { apiClient } from "@/lib/api";

// 1. Executive Summary Interface
export interface ExecutiveSummaryData {
  summary: {
    totalSales: number;
    grossSales: number;
    netSales: number;
    totalTax: number;
    totalCgst: number;
    totalSgst: number;
    totalDiscounts: number;
    refunds: number;
    packagingCharges: number;
    paidAmount: number;
    dueAmount: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalCovers: number;
    averageOrderValue: number;
    averageSpendPerCover: number;
  };
  paymentBreakdown: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  orderTypeBreakdown: Array<{
    orderType: string;
    count: number;
    covers: number;
    sales: number;
  }>;
}

// 2. Sales Summary Interface
export interface SalesSummaryData {
  rows: Array<{
    date: string;
    orderCount: number;
    completedOrders: number;
    cancelledOrders: number;
    grossSales: number;
    discounts: number;
    refunds: number;
    tax: number;
    packagingCharges: number;
    netSales: number;
    grandTotal: number;
    covers: number;
  }>;
  totals: {
    orderCount: number;
    completedOrders: number;
    cancelledOrders: number;
    grossSales: number;
    discounts: number;
    refunds: number;
    tax: number;
    netSales: number;
    grandTotal: number;
    covers: number;
  };
  paymentBreakdown: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

// 3. Category Summary Interface
export interface CategorySummaryData {
  rows: Array<{
    categoryId: string;
    categoryName: string;
    quantitySold: number;
    grossSales: number;
    taxAmount: number;
    discounts: number;
    netSales: number;
    complimentaryQty: number;
    salesPercentage: number;
  }>;
  totalGross: number;
  totalQuantity: number;
  totalTax: number;
}

// 4. Item Summary Interface
export interface ItemSummaryData {
  rows: Array<{
    menuItemId: string;
    itemName: string;
    variantName: string;
    categoryName: string;
    shortCode?: string | null;
    numericCode?: string | null;
    quantitySold: number;
    grossSales: number;
    taxAmount: number;
    discounts: number;
    netSales: number;
    averageSellingPrice: number;
    unitCost: number;
    totalCost: number;
    profit: number;
    profitPercentage: number;
    complimentaryQty: number;
  }>;
  totals: {
    totalQuantity: number;
    totalGrossSales: number;
    totalTax: number;
    totalNetSales: number;
    totalCost: number;
    totalProfit: number;
  };
}

// 5. Order Summary Interface
export interface OrderSummaryData {
  orders: Array<{
    _id: string;
    orderNumber: string | number;
    orderType: string;
    tableNumber: string;
    covers: number;
    status: string;
    waiterName: string;
    cashierName: string;
    customerName: string;
    customerPhone: string;
    subtotal: number;
    discount: number;
    totalTax: number;
    packagingCharge: number;
    grandTotal: number;
    paymentMethods: string;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSales: number;
    totalDiscounts: number;
    totalCovers: number;
    averageOrderValue: number;
  };
}

// 6. Group Summary Interface
export interface GroupSummaryData {
  stationGroups: Array<{
    groupName: string;
    groupType: string;
    quantitySold: number;
    grossSales: number;
    netSales: number;
    salesPercentage: number;
  }>;
  modifierGroups: Array<{
    groupName: string;
    groupType: string;
    quantitySold: number;
    grossSales: number;
    netSales: number;
    salesPercentage: number;
  }>;
  totalStationSales: number;
  totalModifierSales: number;
}

// 7. Variation Summary Interface
export interface VariationSummaryData {
  rows: Array<{
    menuItemId: string;
    itemName: string;
    variantName: string;
    categoryName: string;
    unitPrice: number;
    quantitySold: number;
    grossSales: number;
    taxAmount: number;
    discounts: number;
    netSales: number;
    complimentaryQty: number;
    salesPercentage: number;
  }>;
  totals: {
    totalQuantity: number;
    totalGrossSales: number;
    totalTax: number;
    totalNetSales: number;
  };
}

// 8. Cover Size Summary Interface
export interface CoverSizeSummaryData {
  rows: Array<{
    coverBracket: string;
    sortOrder: number;
    orderCount: number;
    totalCovers: number;
    grossSales: number;
    netSales: number;
    grandTotal: number;
    averageSpendPerCover: number;
    averageOrderValue: number;
    salesPercentage: number;
  }>;
  totals: {
    totalOrders: number;
    totalCovers: number;
    totalNetSales: number;
    totalGrandTotal: number;
    overallAverageSpendPerCover: number;
  };
}

export type PosReportType =
  | "executive"
  | "sales"
  | "category"
  | "item"
  | "order"
  | "group"
  | "variation"
  | "cover-size";

export const posReportsService = {
  getExecutiveSummary: async (restaurantId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ restaurantId });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const res = await apiClient.get(`/pos-reports/executive-summary?${params.toString()}`);
    return res.data;
  },

  getSalesSummary: async (restaurantId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ restaurantId });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const res = await apiClient.get(`/pos-reports/sales-summary?${params.toString()}`);
    return res.data;
  },

  getCategorySummary: async (restaurantId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ restaurantId });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const res = await apiClient.get(`/pos-reports/category-summary?${params.toString()}`);
    return res.data;
  },

  getItemSummary: async (restaurantId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ restaurantId });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const res = await apiClient.get(`/pos-reports/item-summary?${params.toString()}`);
    return res.data;
  },

  getOrderSummary: async (restaurantId: string, paramsObj: Record<string, any> = {}) => {
    const params = new URLSearchParams({ restaurantId });
    Object.keys(paramsObj).forEach((k) => {
      if (paramsObj[k] !== undefined && paramsObj[k] !== null && paramsObj[k] !== "") {
        params.append(k, String(paramsObj[k]));
      }
    });
    const res = await apiClient.get(`/pos-reports/order-summary?${params.toString()}`);
    return res.data;
  },

  getGroupSummary: async (restaurantId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ restaurantId });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const res = await apiClient.get(`/pos-reports/group-summary?${params.toString()}`);
    return res.data;
  },

  getVariationSummary: async (restaurantId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ restaurantId });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const res = await apiClient.get(`/pos-reports/variation-summary?${params.toString()}`);
    return res.data;
  },

  getCoverSizeSummary: async (restaurantId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ restaurantId });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const res = await apiClient.get(`/pos-reports/cover-size-summary?${params.toString()}`);
    return res.data;
  },

  downloadReportExport: async (
    restaurantId: string,
    reportType: PosReportType,
    format: "csv" | "excel" = "csv",
    startDate?: string,
    endDate?: string
  ): Promise<Blob> => {
    const params = new URLSearchParams({ restaurantId, reportType, format });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const res = await apiClient.get(`/pos-reports/export?${params.toString()}`, {
      responseType: "blob",
    });
    return res.data;
  },
};
