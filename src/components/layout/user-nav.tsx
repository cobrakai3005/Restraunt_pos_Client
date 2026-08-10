"use client";

import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export function UserNav() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="hidden space-y-2 sm:block">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-3 w-[80px]" />
        </div>
      </div>
    );
  }

  const name = user?.contactName || user?.username || "Guest";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const role = user?.role || "Guest";

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-11 w-11 border border-[#e3dcff] bg-[#f3eeff] dark:border-[#44357c] dark:bg-[#261f49]">
        <AvatarFallback className="bg-transparent text-sm font-semibold text-[#5e47dc] dark:text-[#ddd5ff]">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="hidden min-w-0 text-left sm:block">
        <p className="max-w-[12rem] truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
          {name}
        </p>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {role}
        </p>
      </div>
    </div>
  );
}
