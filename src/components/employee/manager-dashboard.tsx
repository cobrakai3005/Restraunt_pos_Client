"use client";
import React, { useState } from "react";
import { 
  Flame, 
  Users, 
  ShieldCheck, 
  Package, 
  UserCheck 
} from "lucide-react";
import { User } from "@/services/auth.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTab } from "./inventory/inventory-tab";
import { ManagerOverview } from "./manager-overview";
import { ManagerFloorView } from "./manager-floor-view";
import { ManagerAuditTab } from "./manager-audit-tab";
import { ManagerStaffTab } from "./manager-staff-tab";

interface DashboardProps {
  user: User;
}

export function ManagerDashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
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
  );
}

