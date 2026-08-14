import { apiClient } from "@/lib/api";

export interface AnalyticsData {
  sales: {
    revenue: number;
    todayRevenue: number;
    cost: number;
    profit: number;
    foodCostPercentage: number;
    totalOrders: number;
    paidOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    totalDiscount: number;
  };
  tax: {
    taxableSubtotal: number;
    totalCgst: number;
    totalSgst: number;
    totalTax: number;
    grossTotal: number;
  };
  hourlySales: Array<{
    hour: string;
    revenue: number;
    orderCount: number;
  }>;
  categorySales: Array<{
    categoryName: string;
    quantitySold: number;
    revenue: number;
  }>;
  orderTypeSplit: Array<{
    orderType: string;
    count: number;
    revenue: number;
  }>;
  menuEngineering: {
    avgQtyThreshold: number;
    items: Array<{
      menuItemId: string;
      itemName: string;
      variantName: string;
      categoryName: string;
      shortCode?: string | null;
      numericCode?: string | null;
      quantitySold: number;
      revenue: number;
      pricePerUnit: number;
      unitCost: number;
      profitMargin: number;
      marginPerUnit: number;
      marginPercent: number;
      classification: "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";
      classificationLabel: string;
      recommendation: string;
    }>;
  };
  topItems: Array<{
    itemName: string;
    variantName: string;
    categoryName: string;
    quantitySold: number;
    revenue: number;
    profitMargin: number;
    marginPercent: number;
  }>;
  staffPerformance: Array<{
    staffId: string;
    staffName: string;
    ordersHandled: number;
    revenueGenerated: number;
    avgTicket: number;
  }>;
  voidAudit: Array<{
    _id: string;
    orderNumber: number;
    status: string;
    cancelReason: string;
    cancelledByName: string;
    cancelledAt: string;
    grandTotal: number;
  }>;
  tenderSplit: Array<{
    method: string;
    totalAmount: number;
    transactionCount: number;
  }>;
}

export const analyticsService = {
  getDashboardAnalytics: async (
    restaurantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; data: AnalyticsData; message?: string }> => {
    const params = new URLSearchParams();
    params.append("restaurantId", restaurantId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const res = await apiClient.get(`/analytics/dashboard?${params.toString()}`);
    return res.data;
  },

  downloadReportCsv: async (
    restaurantId: string,
    reportType: "menu-engineering" | "tax" | "staff" | "hourly" | "summary" = "menu-engineering",
    startDate?: string,
    endDate?: string
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    params.append("restaurantId", restaurantId);
    params.append("reportType", reportType);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const res = await apiClient.get(`/analytics/export?${params.toString()}`, {
      responseType: "blob",
    });
    return res.data;
  },
};
