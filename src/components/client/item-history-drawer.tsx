"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { InventoryItem } from "@/services/inventory.service";
import { stockLogService, StockLog } from "@/services/stockLog.service";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Sliders,
  ShoppingBag,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar as CalendarIcon,
} from "lucide-react";

interface ItemHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  restaurantId: string;
}

const PAGE_SIZE = 10;

export function ItemHistoryDrawer({
  open,
  onOpenChange,
  item,
  restaurantId,
}: ItemHistoryDrawerProps) {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter & Pagination States
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [datePreset, setDatePreset] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const loadHistory = useCallback(async (targetPage = 1) => {
    if (!item) return;
    try {
      setLoading(true);

      let fromDate = "";
      let toDate = "";
      const now = new Date();

      if (datePreset === "TODAY") {
        fromDate = format(startOfDay(now), "yyyy-MM-dd");
        toDate = format(endOfDay(now), "yyyy-MM-dd");
      } else if (datePreset === "7DAYS") {
        fromDate = format(subDays(now, 7), "yyyy-MM-dd");
        toDate = format(now, "yyyy-MM-dd");
      } else if (datePreset === "30DAYS") {
        fromDate = format(subDays(now, 30), "yyyy-MM-dd");
        toDate = format(now, "yyyy-MM-dd");
      } else if (datePreset === "CUSTOM") {
        fromDate = startDate;
        toDate = endDate;
      }

      const params: Record<string, any> = {
        page: targetPage,
        limit: PAGE_SIZE,
      };

      if (typeFilter !== "ALL") params.type = typeFilter;
      if (fromDate) params.startDate = fromDate;
      if (toDate) params.endDate = toDate;

      const res = await stockLogService.getItemHistory(item._id, restaurantId, params);
      setLogs(res.data || []);
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalRecords(res.meta.totalRecords || 0);
      }
      setPage(targetPage);
    } catch (err) {
      console.error("Failed to load stock history:", err);
    } finally {
      setLoading(false);
    }
  }, [item, restaurantId, datePreset, typeFilter, startDate, endDate]);

  useEffect(() => {
    if (open && item) {
      setPage(1);
      loadHistory(1);
    } else {
      setLogs([]);
    }
  }, [open, item, datePreset, typeFilter, startDate, endDate, loadHistory]);

  if (!item) return null;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-0 flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" /> Purchase Inward
          </Badge>
        );
      case "POS_CONSUMPTION":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-0 flex items-center gap-1">
            <Utensils className="w-3 h-3" /> POS Recipe
          </Badge>
        );
      case "WASTAGE":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-0 flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Wastage / Loss
          </Badge>
        );
      case "ADJUSTMENT_IN":
        return (
          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border-0 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Audit Surplus
          </Badge>
        );
      case "ADJUSTMENT_OUT":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-0 flex items-center gap-1">
            <ArrowDownRight className="w-3 h-3" /> Audit Deficit
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Sliders className="w-3 h-3" /> Adjustment
          </Badge>
        );
    }
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case "EXPIRED": return "🥛 Expired / Spoiled";
      case "BURNT_COOKING_ERROR": return "🔥 Burnt / Cooking Mistake";
      case "SPILLAGE_BREAKAGE": return "💥 Spillage / Breakage";
      case "STAFF_MEAL": return "👥 Staff Meal";
      case "CUSTOMER_RETURN": return "↩️ Customer Return";
      case "THEFT_MISSING": return "❓ Missing / Shrinkage";
      case "PURCHASE_INWARD": return "📦 Supplier Inward";
      case "POS_RECIPE_DEDUCTION": return "🍳 Recipe Deduction";
      case "PHYSICAL_COUNT_AUDIT": return "📋 Physical Count Audit";
      default: return reason;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col h-full p-0">
        <div className="p-6 pb-3 border-b space-y-1">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <History className="w-5 h-5 text-blue-600" />
              Stock Movement History
            </SheetTitle>
            <SheetDescription>
              Latest audit log of purchases, order consumptions, and wastage.
            </SheetDescription>
          </SheetHeader>

          {/* Item Header Details */}
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white text-base">{item.name}</div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Current Stock: <strong className="text-slate-900 dark:text-white font-semibold">{item.currentStock} {item.unit}</strong></span>
              <span>Cost Rate: <strong className="text-slate-900 dark:text-white font-semibold">₹{item.costPerUnit} / {item.unit}</strong></span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                  <SelectValue placeholder="All Movement Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="PURCHASE">🟢 Purchases</SelectItem>
                  <SelectItem value="POS_CONSUMPTION">🔵 POS Orders</SelectItem>
                  <SelectItem value="WASTAGE">🔴 Wastage / Loss</SelectItem>
                  <SelectItem value="ADJUSTMENT_IN">🟢 Audit Surplus</SelectItem>
                  <SelectItem value="ADJUSTMENT_OUT">🟡 Audit Deficit</SelectItem>
                </SelectContent>
              </Select>

              <Select value={datePreset} onValueChange={(val) => { setDatePreset(val); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-white dark:bg-slate-900">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">📅 All Time</SelectItem>
                  <SelectItem value="TODAY">📅 Today</SelectItem>
                  <SelectItem value="7DAYS">📅 Last 7 Days</SelectItem>
                  <SelectItem value="30DAYS">📅 Last 30 Days</SelectItem>
                  <SelectItem value="CUSTOM">📅 Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Picker Range */}
            {datePreset === "CUSTOM" && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                  className="h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                  className="h-8 text-xs"
                />
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Timeline of Logs */}
        <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm space-y-2">
              <History className="w-10 h-10 mx-auto opacity-20" />
              <p>No movement logs found for this filter.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {logs.map((log) => {
                const isPositive = log.quantity > 0;
                return (
                  <div key={log._id} className="relative space-y-1 text-sm bg-white dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                    {/* Bullet marker */}
                    <div className={`absolute -left-[27px] top-3.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                      log.type === "PURCHASE" || log.type === "ADJUSTMENT_IN" ? "bg-emerald-500" :
                      log.type === "WASTAGE" ? "bg-red-500" : "bg-blue-500"
                    }`} />

                    <div className="flex items-center justify-between">
                      {getTypeBadge(log.type)}
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(log.createdAt), "dd MMM yyyy, hh:mm a")}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className={`text-base font-bold ${
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      }`}>
                        {isPositive ? `+${log.quantity}` : log.quantity} {log.unit}
                      </span>
                      {log.totalValue > 0 && (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Val: ₹{log.totalValue.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground flex justify-between">
                      <span>Stock: {log.previousStock} → <strong className="text-slate-800 dark:text-slate-200">{log.newStock} {log.unit}</strong></span>
                      {log.reason && <span>{getReasonLabel(log.reason)}</span>}
                    </div>

                    {log.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded mt-1 italic border border-slate-100 dark:border-slate-800">
                        &quot;{log.notes}&quot;
                      </p>
                    )}

                    {log.performedBy && (
                      <div className="text-[11px] text-muted-foreground pt-0.5">
                        By: <span className="font-medium text-slate-700 dark:text-slate-300">{log.performedBy.contactName || log.performedBy.username}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Pagination Controls */}
        {totalRecords > 0 && (
          <div className="p-3 px-6 border-t bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalRecords} total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => loadHistory(page - 1)}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => loadHistory(page + 1)}
                disabled={page >= totalPages || loading}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
