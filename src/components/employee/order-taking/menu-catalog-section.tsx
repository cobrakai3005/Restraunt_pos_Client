"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Clock, Users } from "lucide-react";
import { MenuItemCard } from "../menu-item-card";
import { Menu, Table, CartItem } from "./types";

interface MenuCatalogSectionProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  orderType: "DINE_IN" | "TAKEAWAY";
  onSwitchOrderType: (type: "DINE_IN" | "TAKEAWAY") => void;
  selectedTable: string;
  tables: Table[];
  onUnselectTable: () => void;
  guestCount: number;
  onUpdateGuestCount: (delta: number) => void;
  recentlyAdded: Menu[];
  onMenuClick: (item: Menu) => void;
  filteredMenus: Menu[];
  cart: CartItem[];
}

export function MenuCatalogSection({
  searchInputRef,
  searchQuery,
  onSearchChange,
  onSearchKeyDown,
  onClearSearch,
  orderType,
  onSwitchOrderType,
  selectedTable,
  tables,
  onUnselectTable,
  guestCount,
  onUpdateGuestCount,
  recentlyAdded,
  onMenuClick,
  filteredMenus,
  cart,
}: MenuCatalogSectionProps) {
  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden bg-transparent">
      {/* Search & Active Table / Mode Bar */}
      <div className="space-y-3 shrink-0">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search Input with Auto-Punch */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <Input
              ref={searchInputRef as any}
              placeholder="Search dish or type shortcode e.g. 'bn', '101', '3*bn' (Punches instantly on match)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              className="pl-12 pr-32 h-11 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/60 dark:border-slate-700/60 shadow-sm text-sm font-medium rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0 transition-all hover:bg-white dark:hover:bg-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-28 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-6 select-none items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/80 px-2 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300 shadow-xs">
              ⚡ Instant Punch
            </kbd>
          </div>

          {/* Active Table / Mode Status Chip */}
          <div className="flex items-center gap-2 shrink-0">
            {orderType === "TAKEAWAY" ? (
              <div className="flex items-center gap-2 px-3.5 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold shadow-sm">
                <span>🛵 Takeaway Mode</span>
                <button
                  onClick={() => onSwitchOrderType("DINE_IN")}
                  className="ml-1 text-[10px] underline hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  Switch to Dine-In
                </button>
              </div>
            ) : selectedTable ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3.5 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-extrabold shadow-sm">
                  <span>
                    🍽️ Table {tables.find((t) => t._id === selectedTable)?.tableNumber || selectedTable}
                  </span>
                  <button
                    onClick={onUnselectTable}
                    className="p-1 hover:bg-blue-500/20 rounded-md text-blue-600 dark:text-blue-400 transition-colors"
                    title="Unselect table"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-3 h-11 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-700 dark:text-slate-200">
                  <Users className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
                    Covers:
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateGuestCount(-1)}
                    className="h-6 w-6 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 active:scale-95 transition-all text-xs font-bold border border-slate-300 dark:border-slate-700"
                    title="Decrease guest count"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-extrabold text-blue-600 dark:text-blue-400">
                    {guestCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateGuestCount(1)}
                    className="h-6 w-6 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 active:scale-95 transition-all text-xs font-bold border border-slate-300 dark:border-slate-700"
                    title="Increase guest count"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 h-11 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/40 dark:border-slate-700/40 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <span>👈 Select Table on Left</span>
              </div>
            )}
          </div>
        </div>

        {/* UX: Recently Added strip */}
        {recentlyAdded.length > 0 && !searchQuery && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 shrink-0">
              <Clock className="h-3 w-3" /> Recent
            </span>
            {recentlyAdded.map((item) => (
              <button
                key={item._id}
                onClick={() => onMenuClick(item)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm active:scale-95"
              >
                {item.isVeg === true && <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />}
                {item.isVeg === false && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
                {item.name}
                <span className="text-blue-600 dark:text-blue-400 font-bold">+</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu Grid */}
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-10">
          {filteredMenus.map((menu) => {
            const inCartCount = cart
              .filter((item) => item._id === menu._id)
              .reduce((sum, item) => sum + item.quantity, 0);
            const badgeParts = [
              menu.shortCode ? menu.shortCode.toUpperCase() : null,
              menu.numericCode ? `#${menu.numericCode}` : null,
            ].filter(Boolean);
            const shortBadge = badgeParts.length > 0 ? badgeParts.join(" / ") : undefined;

            return (
              <MenuItemCard
                key={menu._id}
                name={menu.name}
                categoryName={menu.categoryId?.name}
                shortCode={shortBadge}
                price={menu.variants?.[0]?.price || 0}
                variantsCount={menu.variants?.length || 0}
                isAvailable={menu.isAvailable}
                imageUrl={menu.imageUrl}
                isVeg={menu.isVeg}
                inCartCount={inCartCount}
                onClick={() => onMenuClick(menu)}
              />
            );
          })}
          {filteredMenus.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-500">
              No menu items found.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
