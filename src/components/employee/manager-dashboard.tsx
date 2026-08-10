"use client";
import React, { useState } from "react";
import { LineChart, LayoutDashboard, Package } from "lucide-react";
import { User } from "@/services/auth.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTab } from "./inventory/inventory-tab";

interface DashboardProps {
  user: User;
}

export function ManagerDashboard({ user }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="inventory"
            className="data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-xl">
            <LineChart className="w-16 h-16 text-purple-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Manager Operations Dashboard (Coming Soon)</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-8">
              This is where Managers will oversee the entire restaurant operations on-the-fly.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-800">
                <h3 className="text-white font-semibold mb-2">Live Floor View</h3>
                <p className="text-sm text-slate-400">See current wait times, active orders, and table turnover rates.</p>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-800">
                <h3 className="text-white font-semibold mb-2">Staff Management</h3>
                <p className="text-sm text-slate-400">Assign Waiters to sections and handle staff overrides or voids.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6 focus-visible:outline-none focus-visible:ring-0">
          <InventoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
