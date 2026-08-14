"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Flame, 
  Users, 
  ShieldCheck, 
  Package, 
  UserCheck,
  BarChart3,
  ArrowLeft,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTab } from "@/components/employee/inventory/inventory-tab";
import { ManagerOverview } from "@/components/employee/manager-overview";
import { ManagerFloorView } from "@/components/employee/manager-floor-view";
import { ManagerAuditTab } from "@/components/employee/manager-audit-tab";
import { ManagerStaffTab } from "@/components/employee/manager-staff-tab";
import { AnalyticsDashboard } from "@/components/client/AnalyticsDashboard";
import { clientService } from "@/services/client.service";

export default function RestaurantDashboard() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [restaurantName, setRestaurantName] = useState("Loading...");

  useEffect(() => {
    if (restaurantId) {
      if (typeof window !== "undefined") {
        localStorage.setItem("vinimay_active_restaurant_id", restaurantId);
      }
      clientService.getRestaurants().then(res => {
        if (res.success) {
          const rest = res.data.restaurants?.find((r: any) => r._id === restaurantId);
          if (rest) setRestaurantName(rest.name);
        }
      });
    }
  }, [restaurantId]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{restaurantName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Branch Management & Floor Control</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-sm">
            <TabsTrigger 
              value="overview"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all gap-2"
            >
              <Flame className="w-4 h-4" />
              Shift Overview
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Reports & Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="floor"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2"
            >
              <Users className="w-4 h-4" />
              Floor Operations
            </TabsTrigger>
            <TabsTrigger 
              value="audit"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Voids & Audit
            </TabsTrigger>
            <TabsTrigger 
              value="inventory"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all gap-2"
            >
              <Package className="w-4 h-4" />
              Inventory & Stock
            </TabsTrigger>
            <TabsTrigger 
              value="staff"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Staff Roster
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <ManagerOverview 
              onNavigateToFloor={() => setActiveTab("floor")} 
              onNavigateToAudit={() => setActiveTab("audit")} 
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <AnalyticsDashboard initialRestaurantId={restaurantId} hideRestaurantSelector={true} />
          </TabsContent>

          <TabsContent value="floor" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <ManagerFloorView />
          </TabsContent>

          <TabsContent value="audit" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <ManagerAuditTab />
          </TabsContent>

          <TabsContent value="inventory" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <InventoryTab />
          </TabsContent>

          <TabsContent value="staff" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
            <ManagerStaffTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
