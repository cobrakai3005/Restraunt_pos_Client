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
  FileSpreadsheet,
  Package,
  Users,
  ShieldCheck,
  UserCheck,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock,
  ChevronRight,
  Flame,
  FileText,
  Radio,
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
import { useToast } from "@/components/ui/use-toast";
import { connectSocket } from "@/lib/socket";

import { WaiterDashboard } from "@/components/employee/waiter-dashboard";
import { ChefDashboard } from "@/components/employee/chef-dashboard";
import { CashierDashboard } from "@/components/employee/cashier-dashboard";
import { ManagerDashboard } from "@/components/employee/manager-dashboard";
import { posReportsService, ExecutiveSummaryData } from "@/services/posReports.service";

export default function EmployeeDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [time, setTime] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [shiftSummary, setShiftSummary] = useState<ExecutiveSummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const [cashierMode, setCashierMode] = useState<"orders" | "kitchen" | "billing" | "receivables" | "reports">("billing");
  const [managerTab, setManagerTab] = useState<string>("overview");

  // Fetch shift summary when drawer opens for cashier or manager
  useEffect(() => {
    if (drawerOpen && user && (user.role === "CASHIER" || user.role === "MANAGER" || user.role === "INVENTORY_MANAGER")) {
      const rId = typeof user.restaurantId === "object" ? (user.restaurantId as any)?._id : user.restaurantId;
      if (rId) {
        setLoadingSummary(true);
        const today = new Date().toISOString().split("T")[0];
        posReportsService
          .getExecutiveSummary(rId, today, today)
          .then((res) => {
            if (res.data) setShiftSummary(res.data);
          })
          .catch(() => {})
          .finally(() => setLoadingSummary(false));
      }
    }
  }, [drawerOpen, user]);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/employee-login");
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
      toast({ title: "🖥️ Fullscreen Mode Enabled" });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
      toast({ title: "Fullscreen Exited" });
    }
  };

  const handleResyncSocket = () => {
    setIsSyncing(true);
    try {
      connectSocket();
      setTimeout(() => {
        setIsSyncing(false);
        toast({
          title: "⚡ Terminal Synced",
          description: "Real-time socket data reconnected and synchronized.",
        });
      }, 500);
    } catch {
      setIsSyncing(false);
    }
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
        return <Calculator className="w-3.5 h-3.5" />;
      case "WAITER":
        return <UtensilsCrossed className="w-3.5 h-3.5" />;
      case "CHEF":
        return <ChefHat className="w-3.5 h-3.5" />;
      case "MANAGER":
      case "INVENTORY_MANAGER":
        return <Shield className="w-3.5 h-3.5" />;
      default:
        return <UserIcon className="w-3.5 h-3.5" />;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "MANAGER":
      case "INVENTORY_MANAGER":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "CASHIER":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "CHEF":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
      case "WAITER":
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    }
  };

  // Build role-aware quick links with active navigation actions
  const isManager = user.role === "MANAGER" || user.role === "INVENTORY_MANAGER";
  const isCashier = user.role === "CASHIER";
  const isChef = user.role === "CHEF";
  const isWaiter = user.role === "WAITER";

  const navLinks: Array<{
    label: string;
    desc: string;
    icon: any;
    badge: string;
    badgeColor: string;
    onSelect: () => void;
  }> = [];

  if (isWaiter || isCashier || isManager) {
    navLinks.push({
      label: "Take Orders & Cart",
      desc: "Interactive POS menu & table orders",
      icon: UtensilsCrossed,
      badge: "POS Core",
      badgeColor: "bg-blue-500/10 text-blue-600",
      onSelect: () => {
        if (isCashier) setCashierMode("orders");
        else if (isManager) setManagerTab("overview");
      },
    });
  }

  if (isChef || isCashier || isManager || isWaiter) {
    navLinks.push({
      label: "Kitchen KOT Queue",
      desc: "Live order prep & station tickets",
      icon: Flame,
      badge: "Live Queue",
      badgeColor: "bg-orange-500/10 text-orange-600",
      onSelect: () => {
        if (isCashier) setCashierMode("kitchen");
        else if (isManager) setManagerTab("overview");
      },
    });
  }

  if (isCashier || isManager) {
    navLinks.push({
      label: "Billing & Settlements",
      desc: "Tax invoices & split payments",
      icon: Calculator,
      badge: "Billing",
      badgeColor: "bg-emerald-500/10 text-emerald-600",
      onSelect: () => {
        if (isCashier) setCashierMode("billing");
      },
    });
    navLinks.push({
      label: "Credit / Khata Dues",
      desc: "Customer credit records & payments",
      icon: FileText,
      badge: "Khata",
      badgeColor: "bg-amber-500/10 text-amber-600",
      onSelect: () => {
        if (isCashier) setCashierMode("receivables");
      },
    });
    navLinks.push({
      label: "POS Reports Hub (8 Reports)",
      desc: "Executive sales, covers, items & exports",
      icon: FileSpreadsheet,
      badge: "New",
      badgeColor: "bg-indigo-500/10 text-indigo-600 font-extrabold",
      onSelect: () => {
        if (isCashier) setCashierMode("reports");
        else if (isManager) setManagerTab("pos-reports");
      },
    });
  }

  if (isManager || isWaiter) {
    navLinks.push({
      label: "Floor & Table Map",
      desc: "Table occupancy, active pax & timers",
      icon: Users,
      badge: "Floor",
      badgeColor: "bg-blue-500/10 text-blue-600",
      onSelect: () => {
        if (isManager) setManagerTab("floor");
      },
    });
  }

  if (isManager) {
    navLinks.push({
      label: "Stock & Inventory",
      desc: "Ingredient balances & low stock alerts",
      icon: Package,
      badge: "Stock",
      badgeColor: "bg-teal-500/10 text-teal-600",
      onSelect: () => {
        setManagerTab("inventory");
      },
    });
    navLinks.push({
      label: "Voids & Security Audit",
      desc: "Cancelled items & manager logs",
      icon: ShieldCheck,
      badge: "Security",
      badgeColor: "bg-purple-500/10 text-purple-600",
      onSelect: () => {
        setManagerTab("audit");
      },
    });
    navLinks.push({
      label: "Staff Roster",
      desc: "Shift schedule & employee roster",
      icon: UserCheck,
      badge: "Staff",
      badgeColor: "bg-slate-500/10 text-slate-600",
      onSelect: () => {
        setManagerTab("staff");
      },
    });
  }

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
      DashboardComponent = (
        <CashierDashboard
          user={user}
          onOpenDrawer={() => setDrawerOpen(true)}
          currentMode={cashierMode}
          onModeChange={setCashierMode}
        />
      );
      break;
    case "MANAGER":
    case "INVENTORY_MANAGER":
      DashboardComponent = (
        <ManagerDashboard
          user={user}
          onOpenDrawer={() => setDrawerOpen(true)}
          currentTab={managerTab}
          onTabChange={setManagerTab}
        />
      );
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
          className="w-84 sm:w-[380px] bg-slate-50 dark:bg-slate-900/95 border-r border-slate-200/80 dark:border-slate-800 p-0 flex flex-col justify-between shadow-2xl z-50 backdrop-blur-xl"
        >
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. Top Brand & Live Clock Header */}
            <SheetHeader className="text-left space-y-2 pb-3 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <SheetTitle className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase leading-tight truncate max-w-[170px]">
                      {restaurantName}
                    </SheetTitle>
                    <SheetDescription className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                      POS Terminal Live
                    </SheetDescription>
                  </div>
                </div>

                {/* Clock Badge */}
                <div className="text-right">
                  <div className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                    {time || "--:--:--"}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                    {dateStr}
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* 2. Staff Operator Profile Card */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Active Operator
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> On Shift
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-900 text-blue-700 dark:text-blue-300 font-black text-sm flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  {(user.contactName || user.username || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {user.contactName || user.username}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email || user.username}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Assigned Role</span>
                <Badge variant="outline" className={`text-[10px] font-extrabold gap-1 px-2 py-0.5 ${getRoleBadgeStyle(user.role)}`}>
                  {getRoleIcon(user.role)}
                  {user.role}
                </Badge>
              </div>
            </div>

            {/* 3. Shift Financial Summary Card (Cashier & Manager) */}
            {(user.role === "CASHIER" || user.role === "MANAGER" || user.role === "INVENTORY_MANAGER") && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/20 dark:border-blue-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Today's Shift Summary
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (isCashier) setCashierMode("reports");
                      else if (isManager) setManagerTab("pos-reports");
                      setDrawerOpen(false);
                    }}
                    className="h-6 px-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-md"
                  >
                    View All ➔
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => {
                      if (isCashier) setCashierMode("reports");
                      else if (isManager) setManagerTab("pos-reports");
                      setDrawerOpen(false);
                    }}
                    className="p-2 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-border/40 cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Net Revenue</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      ₹{shiftSummary?.summary?.netSales?.toLocaleString("en-IN") || 0}
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      if (isCashier) setCashierMode("reports");
                      else if (isManager) setManagerTab("pos-reports");
                      setDrawerOpen(false);
                    }}
                    className="p-2 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-border/40 cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Orders / Covers</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                      {shiftSummary?.summary?.completedOrders || 0} <span className="text-[10px] font-normal text-muted-foreground">({shiftSummary?.summary?.totalCovers || 0} pax)</span>
                    </p>
                  </div>
                </div>

                {/* Tender Breakdown */}
                {shiftSummary?.paymentBreakdown && shiftSummary.paymentBreakdown.length > 0 && (
                  <div className="pt-2 border-t border-blue-200/50 dark:border-blue-900/50 space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Payment Collections</p>
                    <div className="flex flex-wrap gap-1.5">
                      {shiftSummary.paymentBreakdown.map((p) => (
                        <span key={p.method} className="text-[10px] font-bold bg-white/90 dark:bg-slate-950/90 px-2 py-0.5 rounded-lg border border-border/40 text-slate-700 dark:text-slate-300">
                          {p.method}: <strong className="text-foreground">₹{p.amount.toLocaleString("en-IN")}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. Quick Navigation Links */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                Terminal Navigation &amp; Links
              </div>
              <div className="space-y-1">
                {navLinks.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      item.onSelect();
                      setDrawerOpen(false);
                      toast({
                        title: `📌 Switched to ${item.label}`,
                        description: item.desc,
                      });
                    }}
                    className="group flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950/60 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700/60 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-900 group-hover:bg-blue-600 group-hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors">
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={`text-[9px] font-bold px-1.5 py-0 ${item.badgeColor}`}>
                        {item.badge}
                      </Badge>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Terminal Quick Tools */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                Quick Tools &amp; Display
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFullscreen}
                  className="h-9 rounded-xl bg-white dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 font-bold text-xs gap-1.5 justify-start px-2.5 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-blue-500" /> : <Maximize2 className="w-3.5 h-3.5 text-blue-500" />}
                  <span>{isFullscreen ? "Exit Full" : "Fullscreen"}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSyncing}
                  onClick={handleResyncSocket}
                  className="h-9 rounded-xl bg-white dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800 font-bold text-xs gap-1.5 justify-start px-2.5 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Resync Live</span>
                </Button>
              </div>

              {/* Theme & Status row */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Terminal Theme</span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* 6. Bottom Logout Bar */}
          <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 space-y-2">
            <Button
              variant="destructive"
              className="w-full h-10 rounded-xl font-bold shadow-md shadow-rose-500/15 gap-2 bg-rose-600 hover:bg-rose-700 text-white transition-all text-xs"
              onClick={handleLogout}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out Operator</span>
            </Button>
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold px-1">
              <span>Vinimay POS v2.4</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Secure Active Session
              </span>
            </div>
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

