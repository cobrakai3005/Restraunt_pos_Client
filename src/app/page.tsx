"use client"

import { useAuth } from "@/context/auth-context";
import { redirect } from "next/navigation";

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const role = user?.role

  if(isLoading) return "loading....clients"


  switch (role) {
    case "MASTER_ADMIN":
      redirect("/admin/clients");
      break;
    case "CLIENT":
      redirect("/client/analytics");
      break;
    case "CHEF":
    case "WAITER":
    case "MANAGER":
    case "CASHIER":
      redirect("/employees");
      break;


    default:
      redirect("/");
      break;
  }
}
