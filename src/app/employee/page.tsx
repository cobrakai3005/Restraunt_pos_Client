"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { LogOut, Store } from "lucide-react";

import { WaiterDashboard } from "@/components/employee/waiter-dashboard";
import { ChefDashboard } from "@/components/employee/chef-dashboard";
import { CashierDashboard } from "@/components/employee/cashier-dashboard";
import { ManagerDashboard } from "@/components/employee/manager-dashboard";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    authService
      .getMe()
      .then((data) => {
        if (!data || !data.restaurantId) {
          router.push("/employee-login");
        } else {
          setUser(data);
        }
      })
      .catch(() => {
        router.push("/employee-login");
      });
  }, [router]);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/employee-login");
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading your terminal...</p>
      </div>
    );
  }

  // Determine which dashboard to render
  let DashboardComponent;
  switch (user.role) {
    case "WAITER":
      DashboardComponent = <WaiterDashboard user={user} />;
      break;
    case "CHEF":
      DashboardComponent = <ChefDashboard user={user} />;
      break;
    case "CASHIER":
      DashboardComponent = <CashierDashboard user={user} />;
      break;
    case "MANAGER":
    case "INVENTORY_MANAGER":
      DashboardComponent = <ManagerDashboard user={user} />;
      break;
    default:
      DashboardComponent = (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-xl">
          <Store className="w-16 h-16 text-blue-600 dark:text-blue-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Unauthorized Role</h2>
          <p className="text-slate-600 dark:text-slate-400">Your role ({user.role}) does not have a designated terminal.</p>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
          <Store className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Vinimay POS</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Welcome, <span className="text-slate-900 dark:text-white font-medium">{user.contactName || user.username}</span> ({user.role})
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto">
        {DashboardComponent}
      </main>
    </div>
  );
}
