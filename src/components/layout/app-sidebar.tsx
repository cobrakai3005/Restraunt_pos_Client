"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText,Package, Settings, Users, Building2, Store, LogOut, BarChart3, ChefHat, Utensils, ArrowLeftRight, BookOpen, ChevronRight, ClipboardList, Receipt, Clock, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const adminNavItems = [
  
  { icon: ArrowLeftRight, label: "Transactions", href: "/transactions" },
  { icon: Building2, label: "Client Management", href: "/admin/clients" },
  { icon: Store, label: "Restaurants", href: "/admin/restaurants" },
  { icon: FileText, label: "Documents", href: "#" },
  // { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Settings, label: "Settings", href: "#" },
];

const clientNavItems = [
  { icon: BarChart3, label: "Analytics", href: "/client/analytics" },
  { icon: Store, label: "Restaurants", href: "/client/restaurants" },
  { icon: ArrowLeftRight, label: "Transactions", href: "/transactions" },
  { icon: BookOpen, label: "Ledgers", href: "/client/ledgers" },
  { icon: Utensils, label: "Menu", href: "/client/menu" },
  { icon: ChefHat, label: "Recipes (BOM)", href: "/client/menu/recipes" },
  { icon: Users, label: "Employees", href: "/client/employees" },
  { icon: Package, label: "Inventory", href: "/client/inventory" },
  { icon: Settings, label: "Settings", href: "/client/settings" },
];

const reportNavItems = [
  { icon: Utensils, label: "Menu Engineering", href: "/client/reports/menu-engineering" },
  { icon: Receipt, label: "GSTR Tax Summary", href: "/client/reports/tax-summary" },
  { icon: Users, label: "Staff Sales", href: "/client/reports/staff-sales" },
  { icon: Clock, label: "Hourly Peak Sales", href: "/client/reports/hourly-sales" },
  { icon: Sparkles, label: "Executive Summary", href: "/client/reports/executive-summary" },
];

import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSidebar() {
  const { isMobile, isOverlay, setOpenMobile, setOpenOverlay } = useSidebar();
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
      return;
    }
    if (isOverlay) setOpenOverlay(false);
  };

  const menuButtonClass =
    "h-12 rounded-2xl px-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-[#f3efff] hover:text-[#5038d5] hover:shadow-[0_14px_26px_-22px_rgba(139,119,255,0.85)] data-[active=true]:bg-[#8b77ff] data-[active=true]:text-white data-[active=true]:shadow-[0_18px_34px_-18px_rgba(139,119,255,0.95)] dark:text-slate-200 dark:hover:bg-[#261f49] dark:hover:text-white dark:data-[active=true]:bg-[#8b77ff]";

  const name = user?.contactName || user?.username || "Guest";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const role = user?.role || "Guest workspace";

  const currentNavItems = (role === "MASTER_ADMIN" || role === "MASTER_USER") ? adminNavItems : clientNavItems;
  const isReportsRoute = pathname.startsWith("/client/reports");

  return (
    <Sidebar className="border-r-0">
      <div className="relative  flex min-h-0 flex-1 flex-col overflow-hidden border border-[#ddd4ff] bg-gradient-to-b from-[#fcfbff] via-white to-[#f6f2ff] shadow-[0_28px_72px_-52px_rgba(139,119,255,0.9)] dark:border-[#2c2459] dark:from-[#000] dark:via-[#0000] dark:to-[#000]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,_rgba(139,119,255,0.2),_transparent_58%)]" />
        <div className="pointer-events-none absolute -right-10 top-16 h-28 w-28 rounded-full bg-[#8b77ff]/16 blur-3xl" />

        <SidebarHeader className="relative p-4 pb-3">
          <div className="">
            <div className="flex items-center gap-2 justify-center mt-6">
              <img
                src="/vinimaylogov.webp"
                alt="Vinimay"
                className="xl:h-[6vh] h-[5vh] w-auto object-cover"
              />
              <img
                src="/vinimaylogotext.webp"
                alt="Vinimay"
                className="xl:h-[3vh] h-[2vh] mt-[3vh] ml-[-2vh] w-auto object-cover"
              />
            </div>
          </div>
        </SidebarHeader>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <SidebarMenu className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-4 pt-1">
            {currentNavItems.map((item, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  className={menuButtonClass}
                  onClick={handleNavClick}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}

            <SidebarGroup>
              <Collapsible defaultOpen={isReportsRoute} className="group/collapsible">
                <SidebarGroupLabel asChild>
                    <CollapsibleTrigger className="w-full cursor-pointer select-none gap-2 py-1.5 hover:bg-[#f3efff] hover:text-[#5038d5] rounded-lg dark:hover:bg-[#261f49] dark:hover:text-white transition-colors">
                      <ClipboardList className="h-4 w-4 text-[#8b77ff] dark:text-[#a99bf5]" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reports</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {reportNavItems.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === item.href}
                            onClick={handleNavClick}
                            className="data-[active=true]:bg-[#8b77ff] data-[active=true]:text-white"
                          >
                            <Link href={item.href}>
                              <item.icon />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
          </SidebarMenu>
        </div>

        <div className="relative border-t border-[#ece6ff] p-4 dark:border-[#2f2558]">
          <div className="rounded-[22px] border border-white/80 bg-white/80 p-3 shadow-[0_18px_35px_-28px_rgba(139,119,255,0.7)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-full max-w-[120px]" />
                  <Skeleton className="h-3 w-full max-w-[80px]" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-[#e3dcff] bg-[#f3eeff] dark:border-[#44357c] dark:bg-[#261f49]">
                  <AvatarFallback className="bg-transparent font-semibold text-[#5e47dc] dark:text-[#ddd5ff]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {name}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {role}
                  </p>
                </div>
                <button 
                  onClick={() => logout()}
                  className="rounded-full p-2 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30"
                  title="Log out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
 
 
 
 
     
   