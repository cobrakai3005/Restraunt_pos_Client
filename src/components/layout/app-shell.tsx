"use client";

import React from "react";
import { Search } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (isLoading || !user) return;

    const staffRoles = ["WAITER", "CHEF", "CASHIER", "MANAGER", "INVENTORY_MANAGER"];
    
    // If a staff member loads the AppShell (which is for Admin/Client), force them to their terminal
    if (staffRoles.includes(user.role)) {
      router.replace("/employee");
      return;
    }

    // If a client tries to access the master admin dashboard, bounce them to playground
    if (user.role === "CLIENT" && pathname.startsWith("/admin")) {
      router.replace("/playground");
      return;
    }
  }, [user, isLoading, router, pathname]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full">
          <header className=" fixed xl:relative flex h-16 items-center justify-between xl:gap-4  border-b border-border/40 bg-card px-4 xl:px-6 w-full top-0 z-20">
            <div className="flex items-center gap-1 xl:gap-4">
              <SidebarTrigger className="xl:hidden" />
              <div className="hidden xl:block">
                <h1 className="text-lg font-semibold">Vinimay UI Starter</h1>
                <p className="text-sm text-muted-foreground">Reusable layout and component reference</p>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 xl:gap-4">
              <div className="relative w-full max-w-md hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search interface" className="pl-9 bg-background pr-10" />
              </div>
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 p-1 xl:p-2 h-auto">
                    <UserNav />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Starter Profile</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>No login required</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 xl:p-6 overflow-auto overflow-x-hidden pt-20 xl:pt-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
