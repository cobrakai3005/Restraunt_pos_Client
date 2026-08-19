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
import { 
  FileText, 
  Package, 
  Settings, 
  Users, 
  Building2, 
  Store, 
  LogOut, 
  BarChart3, 
  ChefHat, 
  Utensils, 
  UtensilsCrossed,
  Tags,
  ArrowLeftRight, 
  BookOpen, 
  ChevronRight, 
  ClipboardList, 
  Receipt, 
  Clock, 
  Sparkles,
  LayoutGrid,
  UserCog,
  SlidersHorizontal,
  FileSpreadsheet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const adminNavItems = [
  { icon: ArrowLeftRight, label: "Transactions", href: "/transactions" },
  { icon: Building2, label: "Client Management", href: "/admin/clients" },
  { icon: Store, label: "Restaurants", href: "/admin/restaurants" },
  { icon: FileSpreadsheet, label: "POS Reports", href: "/admin/reports" },
  { icon: FileText, label: "Documents", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
];

const clientDirectNavItems = [
  { icon: Store, label: "Restaurants", href: "/client/restaurants" },
  { icon: ArrowLeftRight, label: "Transactions", href: "/transactions" },
  { icon: BookOpen, label: "Ledger", href: "/client/ledgers" },
  { icon: FileSpreadsheet, label: "POS Reports", href: "/client/reports" },
];

const managementSubItems = [
  { icon: Utensils, label: "Menu", href: "/client/menu" },
  { icon: Tags, label: "Categories", href: "/client/categories" },
  { icon: UtensilsCrossed, label: "Tables", href: "/client/tables" },
  { icon: ChefHat, label: "Recipes", href: "/client/menu/recipes" },
  { icon: Package, label: "Inventory", href: "/client/inventory" },
];

const employeeSettingsSubItems = [
  { icon: Users, label: "Employees", href: "/client/employees" },
  { icon: Settings, label: "Settings & Config", href: "/client/settings" },
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

  const isAdmin = role === "MASTER_ADMIN" || role === "MASTER_USER";
  
  const isManagementRoute = 
    pathname.startsWith("/client/menu") || 
    pathname.startsWith("/client/categories") || 
    pathname.startsWith("/client/tables") || 
    pathname.startsWith("/client/inventory");
  const isEmployeeSettingsRoute = 
    pathname.startsWith("/client/employees") || 
    pathname.startsWith("/client/settings");

  return (
    // <Sidebar className="border-r-0">
    //   <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden border border-[#ddd4ff] bg-gradient-to-b from-[#fcfbff] via-white to-[#f6f2ff] shadow-[0_28px_72px_-52px_rgba(139,119,255,0.9)] dark:border-[#2c2459] dark:from-[#000] dark:via-[#0000] dark:to-[#000]">
    //     <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,_rgba(139,119,255,0.2),_transparent_58%)]" />
    //     <div className="pointer-events-none absolute -right-10 top-16 h-28 w-28 rounded-full bg-[#8b77ff]/16 blur-3xl" />

    //     <SidebarHeader className="relative p-4 pb-3">
    //       <div>
    //         <div className="flex items-center gap-2 justify-center mt-6">
    //           <img
    //             src="/vinimaylogov.webp"
    //             alt="Vinimay"
    //             className="xl:h-[6vh] h-[5vh] w-auto object-cover"
    //           />
    //           <img
    //             src="/vinimaylogotext.webp"
    //             alt="Vinimay"
    //             className="xl:h-[3vh] h-[2vh] mt-[3vh] ml-[-2vh] w-auto object-cover"
    //           />
    //         </div>
    //       </div>
    //     </SidebarHeader>

    //     <div className="relative flex min-h-0 flex-1 flex-col">
    //       <SidebarMenu className="flex-1 space-y-1.5 overflow-y-auto px-4 pb-4 pt-1">
    //         {isAdmin ? (
    //           adminNavItems.map((item, index) => (
    //             <SidebarMenuItem key={index}>
    //               <SidebarMenuButton
    //                 asChild
    //                 isActive={pathname === item.href}
    //                 tooltip={item.label}
    //                 className={menuButtonClass}
    //                 onClick={handleNavClick}
    //               >
    //                 <Link href={item.href}>
    //                   <item.icon />
    //                   <span>{item.label}</span>
    //                 </Link>
    //               </SidebarMenuButton>
    //             </SidebarMenuItem>
    //           ))
    //         ) : (
    //           <>
    //             {/* 1. Restaurants, 2. Transactions, 3. Ledger */}
    //             {clientDirectNavItems.map((item, index) => (
    //               <SidebarMenuItem key={index}>
    //                 <SidebarMenuButton
    //                   asChild
    //                   isActive={pathname === item.href}
    //                   tooltip={item.label}
    //                   className={menuButtonClass}
    //                   onClick={handleNavClick}
    //                 >
    //                   <Link href={item.href}>
    //                     <item.icon />
    //                     <span>{item.label}</span>
    //                   </Link>
    //                 </SidebarMenuButton>
    //               </SidebarMenuItem>
    //             ))}

    //             {/* 4. Management Collapsible (Menu, Tables, Recipes, Inventory only) */}
    //             <SidebarGroup className="p-0 pt-1">
    //               <Collapsible defaultOpen={isManagementRoute} className="group/management">
    //                 <SidebarGroupLabel asChild>
    //                   <CollapsibleTrigger 
    //                     className={`w-full cursor-pointer select-none gap-2 py-2 px-3 hover:bg-[#f3efff] hover:text-[#5038d5] rounded-xl dark:hover:bg-[#261f49] dark:hover:text-white transition-all flex items-center ${
    //                       isManagementRoute 
    //                         ? "bg-[#ede8ff] text-[#5038d5] font-semibold dark:bg-[#2e265c] dark:text-[#ddd5ff]" 
    //                         : "text-slate-700 dark:text-slate-200"
    //                     }`}
    //                   >
    //                     <LayoutGrid className="h-4 w-4 text-[#8b77ff] dark:text-[#a99bf5]" />
    //                     <span className="text-sm font-medium">Management</span>
    //                     <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/management:rotate-90" />
    //                   </CollapsibleTrigger>
    //                 </SidebarGroupLabel>
    //                 <CollapsibleContent>
    //                   <SidebarMenuSub className="space-y-1 my-1">
    //                     {managementSubItems.map((item) => (
    //                       <SidebarMenuSubItem key={item.href}>
    //                         <SidebarMenuSubButton
    //                           asChild
    //                           isActive={pathname === item.href}
    //                           onClick={handleNavClick}
    //                           className="rounded-xl data-[active=true]:bg-[#8b77ff] data-[active=true]:text-white transition-colors"
    //                         >
    //                           <Link href={item.href} className="flex items-center gap-2">
    //                             <item.icon className="h-4 w-4" />
    //                             <span>{item.label}</span>
    //                           </Link>
    //                         </SidebarMenuSubButton>
    //                       </SidebarMenuSubItem>
    //                     ))}
    //                   </SidebarMenuSub>
    //                 </CollapsibleContent>
    //               </Collapsible>
    //             </SidebarGroup>

    //             {/* 5. Employee Settings Collapsible */}
    //             <SidebarGroup className="p-0 pt-1">
    //               <Collapsible defaultOpen={isEmployeeSettingsRoute} className="group/empSettings">
    //                 <SidebarGroupLabel asChild>
    //                   <CollapsibleTrigger 
    //                     className={`w-full cursor-pointer select-none gap-2 py-2 px-3 hover:bg-[#f3efff] hover:text-[#5038d5] rounded-xl dark:hover:bg-[#261f49] dark:hover:text-white transition-all flex items-center ${
    //                       isEmployeeSettingsRoute 
    //                         ? "bg-[#ede8ff] text-[#5038d5] font-semibold dark:bg-[#2e265c] dark:text-[#ddd5ff]" 
    //                         : "text-slate-700 dark:text-slate-200"
    //                     }`}
    //                   >
    //                     <UserCog className="h-4 w-4 text-[#8b77ff] dark:text-[#a99bf5]" />
    //                     <span className="text-sm font-medium">Employee Settings</span>
    //                     <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/empSettings:rotate-90" />
    //                   </CollapsibleTrigger>
    //                 </SidebarGroupLabel>
    //                 <CollapsibleContent>
    //                   <SidebarMenuSub className="space-y-1 my-1">
    //                     {employeeSettingsSubItems.map((item) => (
    //                       <SidebarMenuSubItem key={item.href}>
    //                         <SidebarMenuSubButton
    //                           asChild
    //                           isActive={pathname === item.href}
    //                           onClick={handleNavClick}
    //                           className="rounded-xl data-[active=true]:bg-[#8b77ff] data-[active=true]:text-white transition-colors"
    //                         >
    //                           <Link href={item.href} className="flex items-center gap-2">
    //                             <item.icon className="h-4 w-4" />
    //                             <span>{item.label}</span>
    //                           </Link>
    //                         </SidebarMenuSubButton>
    //                       </SidebarMenuSubItem>
    //                     ))}
    //                   </SidebarMenuSub>
    //                 </CollapsibleContent>
    //               </Collapsible>
    //             </SidebarGroup>
    //           </>
    //         )}
    //       </SidebarMenu>
    //     </div>

    //     <div className="relative border-t border-[#ece6ff] p-4 dark:border-[#2f2558]">
    //       <div className="rounded-[22px] border border-white/80 bg-white/80 p-3 shadow-[0_18px_35px_-28px_rgba(139,119,255,0.7)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
    //         {isLoading ? (
    //           <div className="flex items-center gap-3">
    //             <Skeleton className="h-11 w-11 rounded-full" />
    //             <div className="min-w-0 flex-1 space-y-2">
    //               <Skeleton className="h-4 w-full max-w-[120px]" />
    //               <Skeleton className="h-3 w-full max-w-[80px]" />
    //             </div>
    //           </div>
    //         ) : (
    //           <div className="flex items-center gap-3">
    //             <Avatar className="h-11 w-11 border border-[#e3dcff] bg-[#f3eeff] dark:border-[#44357c] dark:bg-[#261f49]">
    //               <AvatarFallback className="bg-transparent font-semibold text-[#5e47dc] dark:text-[#ddd5ff]">
    //                 {initials}
    //               </AvatarFallback>
    //             </Avatar>
    //             <div className="min-w-0 flex-1">
    //               <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
    //                 {name}
    //               </p>
    //               <p className="truncate text-xs text-slate-500 dark:text-slate-400">
    //                 {role}
    //               </p>
    //             </div>
    //             <button 
    //               onClick={() => logout()}
    //               className="rounded-full p-2 text-slate-400 transition-colors hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30"
    //               title="Log out"
    //             >
    //               <LogOut className="h-4 w-4" />
    //             </button>
    //           </div>
    //         )}
    //       </div>
    //     </div>
    //   </div>
    // </Sidebar>

    
    
<Sidebar className="border-r-0">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden border border-slate-200 bg-gradient-to-b from-white via-white to-blue-50/40 shadow-[0_28px_72px_-52px_rgba(37,99,235,0.35)] dark:border-white/10 dark:from-black dark:via-black dark:to-black">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.16),_transparent_58%)]" />
        <div className="pointer-events-none absolute -right-10 top-16 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl" />

        <SidebarHeader className="relative p-4 pb-3">
          <div>
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
            {isAdmin ? (
              adminNavItems.map((item, index) => (
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
              ))
            ) : (
              <>
                {/* 1. Restaurants, 2. Transactions, 3. Ledger */}
                {clientDirectNavItems.map((item, index) => (
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

                {/* 4. Management Collapsible (Menu, Tables, Recipes, Inventory only) */}
                <SidebarGroup className="p-0 pt-1">
                  <Collapsible defaultOpen={isManagementRoute} className="group/management">
                    <SidebarGroupLabel asChild>
                      <CollapsibleTrigger 
                        className={`w-full cursor-pointer select-none gap-2 py-2 px-3 hover:bg-blue-50 hover:text-blue-700 rounded-xl dark:hover:bg-blue-500/10 dark:hover:text-white transition-all flex items-center ${
                          isManagementRoute 
                            ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-500/15 dark:text-blue-300" 
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <LayoutGrid className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium">Management</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/management:rotate-90" />
                      </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                      <SidebarMenuSub className="space-y-1 my-1">
                        {managementSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.href}
                              onClick={handleNavClick}
                              className="rounded-xl data-[active=true]:bg-blue-600 data-[active=true]:text-white transition-colors"
                            >
                              <Link href={item.href} className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarGroup>

                {/* 5. Employee Settings Collapsible */}
                <SidebarGroup className="p-0 pt-1">
                  <Collapsible defaultOpen={isEmployeeSettingsRoute} className="group/empSettings">
                    <SidebarGroupLabel asChild>
                      <CollapsibleTrigger 
                        className={`w-full cursor-pointer select-none gap-2 py-2 px-3 hover:bg-blue-50 hover:text-blue-700 rounded-xl dark:hover:bg-blue-500/10 dark:hover:text-white transition-all flex items-center ${
                          isEmployeeSettingsRoute 
                            ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-500/15 dark:text-blue-300" 
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <UserCog className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium">Employee Settings</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/empSettings:rotate-90" />
                      </CollapsibleTrigger>
                    </SidebarGroupLabel>
                    <CollapsibleContent>
                      <SidebarMenuSub className="space-y-1 my-1">
                        {employeeSettingsSubItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.href}
                              onClick={handleNavClick}
                              className="rounded-xl data-[active=true]:bg-blue-600 data-[active=true]:text-white transition-colors"
                            >
                              <Link href={item.href} className="flex items-center gap-2">
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarGroup>
              </>
            )}
          </SidebarMenu>
        </div>

        <div className="relative border-t border-slate-200 p-4 dark:border-white/10">
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-3 shadow-[0_18px_35px_-28px_rgba(37,99,235,0.45)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:shadow-none">
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
                <Avatar className="h-11 w-11 border border-blue-100 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10">
                  <AvatarFallback className="bg-transparent font-semibold text-blue-600 dark:text-blue-300">
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
 
 
 
 
     
   