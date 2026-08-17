"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService, User } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Store,
  Menu,
  User as UserIcon,
  Shield,
  Calculator,
  UtensilsCrossed,
  ChefHat,
  CheckCircle2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";

import { WaiterDashboard } from "@/components/employee/waiter-dashboard";
import { ChefDashboard } from "@/components/employee/chef-dashboard";
import { CashierDashboard } from "@/components/employee/cashier-dashboard";
import { ManagerDashboard } from "@/components/employee/manager-dashboard";

export default function EmployeeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        <p className="text-slate-400 font-medium">Loading your terminal...</p>
      </div>
    );
  }

  const restaurantName =
    (user as any)?.restaurant?.name ||
    (typeof user.restaurantId === "object" ? (user.restaurantId as any)?.name : null) ||
    "Vinimay Cafe";

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "CASHIER":
        return <Calculator className="w-4 h-4" />;
      case "WAITER":
        return <UtensilsCrossed className="w-4 h-4" />;
      case "CHEF":
        return <ChefHat className="w-4 h-4" />;
      case "MANAGER":
      case "INVENTORY_MANAGER":
        return <Shield className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  // Determine which dashboard to render
  let DashboardComponent;
  switch (user.role) {
    case "WAITER":
      DashboardComponent = <WaiterDashboard user={user} onOpenDrawer={() => setDrawerOpen(true)} />;
      break;
    case "CHEF":
      DashboardComponent = <ChefDashboard user={user} onOpenDrawer={() => setDrawerOpen(true)} />;
      break;
    case "CASHIER":
      DashboardComponent = <CashierDashboard user={user} onOpenDrawer={() => setDrawerOpen(true)} />;
      break;
    case "MANAGER":
    case "INVENTORY_MANAGER":
      DashboardComponent = <ManagerDashboard user={user} onOpenDrawer={() => setDrawerOpen(true)} />;
      break;
    default:
      DashboardComponent = (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-xl m-8">
          <Store className="w-16 h-16 text-blue-600 dark:text-blue-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Unauthorized Role</h2>
          <p className="text-slate-600 dark:text-slate-400">Your role ({user.role}) does not have a designated terminal.</p>
        </div>
      );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 transition-colors">
      {/* ── Slide-out Collapsible Drawer / Sidebar ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          className="w-80 sm:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-0 flex flex-col justify-between shadow-2xl z-50"
        >
          {/* Top Brand & Info Section */}
          <div className="p-6 space-y-6">
            <SheetHeader className="text-left space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <SheetTitle className="text-base font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                    {restaurantName} POS
                  </SheetTitle>
                  <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Terminal Active
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Staff Profile Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Logged In Operator
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  {(user.contactName || user.username || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {user.contactName || user.username}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email || user.username}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Assigned Role</span>
                <Badge
                  variant="outline"
                  className="bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[11px] font-bold gap-1 px-2.5 py-0.5"
                >
                  {getRoleIcon(user.role)}
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* Quick Settings & Appearance */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Preferences &amp; Display
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Interface Theme
                </div>
                <ThemeToggle />
              </div>
            </div>

            {/* Terminal Status */}
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-snug">
                <span className="font-bold">Connected &amp; Synced</span>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80">Socket real-time updates active</p>
              </div>
            </div>
          </div>

          {/* Bottom Actions / Logout */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
            <Button
              variant="destructive"
              className="w-full h-11 rounded-xl font-bold shadow-md shadow-red-500/20 gap-2 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout Terminal
            </Button>
            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
              Vinimay Cafe POS v2.0 • Secured Employee Session
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Terminal View */}
      <main className="h-full w-full overflow-hidden">
        {DashboardComponent}
      </main>
    </div>
  );
}
