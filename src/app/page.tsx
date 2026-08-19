"use client";

import { useAuth } from "@/context/auth-context";
import { redirect } from "next/navigation";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const role = user?.role;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-pulse font-extrabold text-sm text-slate-500">Loading workspace...</div>
      </div>
    );
  }

  if (!user) {
    redirect("/client-login");
  }

  switch (role) {
    case "MASTER_ADMIN":
    case "MASTER_USER":
      redirect("/admin/clients");
      break;
    case "CLIENT":
      redirect("/client/analytics");
      break;
    case "CHEF":
    case "WAITER":
    case "MANAGER":
    case "CASHIER":
    case "INVENTORY_MANAGER":
      redirect("/employee");
      break;
    default:
      redirect("/login");
      break;
  }
}
