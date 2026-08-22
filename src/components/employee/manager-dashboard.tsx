"use client";
import React, { lazy, Suspense, useState } from "react";
import { 
  Flame, 
  Users, 
  ShieldCheck, 
  Package, 
  UserCheck,
  BarChart3,
  Menu,
  FileSpreadsheet,
} from "lucide-react";
import { User } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const InventoryTab = lazy(() => import("./inventory/inventory-tab").then((module) => ({ default: module.InventoryTab })));
const ManagerFloorView = lazy(() => import("./manager-floor-view").then((module) => ({ default: module.ManagerFloorView })));
const ManagerAuditTab = lazy(() => import("./manager-audit-tab").then((module) => ({ default: module.ManagerAuditTab })));
const ManagerStaffTab = lazy(() => import("./manager-staff-tab").then((module) => ({ default: module.ManagerStaffTab })));
const AnalyticsDashboard = lazy(() => import("@/components/client/AnalyticsDashboard").then((module) => ({ default: module.AnalyticsDashboard })));
const PosReportsHub = lazy(() => import("@/components/client/reports/pos-reports-hub").then((module) => ({ default: module.PosReportsHub })));

interface DashboardProps {
  user: User;
  onOpenDrawer?: () => void;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

function ManagerTabFallback() {
  return (
    <div className="flex min-h-[280px] items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
      Loading workspace…
    </div>
  );
}

export function ManagerDashboard({ user, onOpenDrawer, currentTab, onTabChange }: DashboardProps) {
  const [internalTab, setInternalTab] = useState("floor");
  const activeTab = currentTab !== undefined ? currentTab : internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const restaurantId = typeof user.restaurantId === 'object' ? (user.restaurantId as any)?._id : user.restaurantId;

  return (
    <div className="h-screen overflow-y-auto p-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex items-center gap-3">
          {onOpenDrawer && (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenDrawer}
              title="Open Restaurant POS Menu & Settings"
              className="h-10 w-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-sm">
            <TabsTrigger 
              value="floor"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2"
            >
              <Users className="w-4 h-4" />
              Floor &amp; Table Maps
            </TabsTrigger>
            <TabsTrigger 
              value="inventory"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white transition-all gap-2"
            >
              <Package className="w-4 h-4" />
              Stock &amp; Inventory
            </TabsTrigger>
            <TabsTrigger 
              value="audit"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Voids &amp; Security Alerts
            </TabsTrigger>
            <TabsTrigger 
              value="staff"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Staff Roster
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="pos-reports"
              className="rounded-xl px-4 py-2 text-xs font-bold data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="floor" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <Suspense fallback={<ManagerTabFallback />}>
            <ManagerFloorView />
          </Suspense>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <Suspense fallback={<ManagerTabFallback />}>
            <InventoryTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="audit" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <Suspense fallback={<ManagerTabFallback />}>
            <ManagerAuditTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="staff" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <Suspense fallback={<ManagerTabFallback />}>
            <ManagerStaffTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <Suspense fallback={<ManagerTabFallback />}>
            <AnalyticsDashboard initialRestaurantId={restaurantId} hideRestaurantSelector={true} />
          </Suspense>
        </TabsContent>

        <TabsContent value="pos-reports" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <Suspense fallback={<ManagerTabFallback />}>
            <PosReportsHub initialRestaurantId={restaurantId} hideRestaurantSelector={true} defaultTab="executive" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
