"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layers } from "lucide-react";
import { Menu } from "./types";

interface CategorySidebarProps {
  categories: { _id: string; name: string }[];
  menus: Menu[];
  activeCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  categoryCountMap: Map<string, number>;
}

export function CategorySidebar({
  categories,
  menus,
  activeCategoryId,
  onSelectCategory,
  categoryCountMap,
}: CategorySidebarProps) {
  return (
    <div className="hidden lg:flex flex-col w-[175px] border-r border-white/30 dark:border-white/10 bg-white/40 dark:bg-slate-950/40 z-10 shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)] transition-colors backdrop-blur-xl">
      <div className="p-4 border-b border-white/30 dark:border-slate-800/50 shrink-0 flex items-center justify-between">
        <h2 className="font-extrabold tracking-tight text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-blue-500" /> Categories
        </h2>
        <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
          {categories.length + 1}
        </span>
      </div>
      <ScrollArea className="flex-1 p-2.5">
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectCategory("All")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 text-left ${
              activeCategoryId === "All"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                : "text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 bg-white/30 dark:bg-slate-900/30"
            }`}
          >
            <span className="truncate">All Items</span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                activeCategoryId === "All"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300"
              }`}
            >
              {menus.length}
            </span>
          </button>
          {categories.map((cat) => {
            const count = categoryCountMap.get(cat._id) || 0;
            const isActive = activeCategoryId === cat._id;
            return (
              <button
                key={cat._id}
                onClick={() => onSelectCategory(cat._id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[0.9rem] font-bold transition-all duration-200 text-left ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                    : "text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/80 bg-white/30 dark:bg-slate-900/30"
                }`}
              >
                <span className="truncate">{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/80 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
