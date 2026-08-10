import { apiClient } from "@/lib/api";

export const analyticsService = {
  getDashboardAnalytics: async (
    restaurantId: string,
    startDate?: string,
    endDate?: string
  ) => {
    const params = new URLSearchParams();
    params.append("restaurantId", restaurantId);
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const res = await apiClient.get(`/analytics/dashboard?${params.toString()}`);
    return res.data;
  },
};
