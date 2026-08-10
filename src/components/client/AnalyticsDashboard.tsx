"use client";

import React, { useEffect, useState } from "react";
import { analyticsService } from "@/services/analytics.service";
import { clientService } from "@/services/client.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Loader2, TrendingUp, DollarSign, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const COLORS = ["#8b77ff", "#22d3ee", "#fbbf24", "#f43f5e", "#10b981", "#6366f1"];

interface AnalyticsData {
  sales: { revenue: number; todayRevenue: number; cost: number; profit: number };
  topItems: Array<{ itemName: string; variantName: string; quantitySold: number; revenue: number }>;
  staffPerformance: Array<{ staffId: string; staffName: string; ordersHandled: number; revenueGenerated: number }>;
  tenderSplit: Array<{ method: string; totalAmount: number; transactionCount: number }>;
}

export function AnalyticsDashboard() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set default dates (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    
    setEndDate(end.toISOString().split("T")[0]);
    setStartDate(start.toISOString().split("T")[0]);

    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      loadAnalytics();
    }
  }, [selectedRestaurantId]); // Intentionally omitting dates here so it doesn't auto-fetch on every keystroke

  const loadRestaurants = async () => {
    try {
      const res = await clientService.getRestaurants();
      if (res.success && res.data && res.data.restaurants) {
        setRestaurants(res.data.restaurants);
        if (res.data.restaurants.length > 0) {
          setSelectedRestaurantId(res.data.restaurants[0]._id);
        }
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to load restaurants" });
    }
  };

  const loadAnalytics = async () => {
    if (!selectedRestaurantId) return;
    try {
      setLoading(true);
      const res = await analyticsService.getDashboardAnalytics(selectedRestaurantId, startDate, endDate);
      if (res.success) {
        setData(res.data);
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Analytics Error", 
        description: error.response?.data?.message || "Failed to load analytics" 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-xl border border-border/40 shadow-sm">
        <div className="space-y-1.5 w-full md:w-1/3">
          <Label>Restaurant</Label>
          <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
            <SelectTrigger>
              <SelectValue placeholder="Select Restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map(r => (
                <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 w-full md:w-1/4">
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5 w-full md:w-1/4">
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div className="w-full md:w-auto">
          <Button onClick={loadAnalytics} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Refresh
          </Button>
        </div>
      </div>

      {loading && !data && (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="w-16 h-16" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  Today's Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(data.sales.todayRevenue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="w-16 h-16" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(data.sales.revenue)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-rose-500/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-16 h-16" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  Total Cost (Est.)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(data.sales.cost)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp className="w-16 h-16" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  Gross Profit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(data.sales.profit)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Items Chart */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topItems} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" />
                      <YAxis dataKey="itemName" type="category" width={100} tick={{ fontSize: 12 }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey="quantitySold" name="Quantity Sold" fill="#8b77ff" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Tender Split Chart */}
            <Card className="border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle>Revenue by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  {data.tenderSplit.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.tenderSplit}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="totalAmount"
                        >
                          {data.tenderSplit.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-muted-foreground flex items-center h-full">No payment data available</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Staff Performance */}
            <Card className="border-border/40 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle>Staff Performance (Waiters)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Staff Name</th>
                        <th className="px-4 py-3">Orders Handled</th>
                        <th className="px-4 py-3 rounded-tr-lg">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.staffPerformance.length > 0 ? (
                        data.staffPerformance.map((staff, idx) => (
                          <tr key={idx} className="border-b border-border/40 last:border-0 hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium">{staff.staffName}</td>
                            <td className="px-4 py-3">{staff.ordersHandled}</td>
                            <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                              {formatCurrency(staff.revenueGenerated)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                            No staff performance data available for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
