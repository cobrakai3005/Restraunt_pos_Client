"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  Calculator,
  Printer,
  DollarSign,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Percent,
  FileSpreadsheet,
  Layers,
  Store,
  Coins,
  History,
  Lock,
  Unlock,
  Loader2,
} from "lucide-react";
import {
  posReportsService,
  CurrentDrawerResponse,
  CashDrawerSession,
  DenominationCounts,
  ZReportData,
} from "@/services/posReports.service";
import { cashierKeys } from "@/hooks/queries/cashier-keys";

interface ZReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  userRole?: string;
  userName?: string;
  restaurantName?: string;
}

export function ZReportDialog({
  open,
  onOpenChange,
  restaurantId,
  userRole,
  userName = "Cashier",
  restaurantName = "",
}: ZReportDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"reconciliation" | "financials" | "payouts" | "print">("reconciliation");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerData, setDrawerData] = useState<CurrentDrawerResponse | null>(null);
  const [latestClosedZReport, setLatestClosedZReport] = useState<ZReportData | null>(null);

  const effectiveCafeName =
    latestClosedZReport?.restaurant?.name ||
    drawerData?.drawer?.zReportData?.restaurant?.name ||
    (drawerData as any)?.restaurant?.name ||
    restaurantName ||
    "CAFE & RESTAURANT";

  // Opening drawer state
  const [openingFloatInput, setOpeningFloatInput] = useState<string>("0");
  const [openingShiftName, setOpeningShiftName] = useState<"MORNING" | "EVENING" | "NIGHT" | "FULL_DAY">("FULL_DAY");

  // Denominations counter
  const [d500, setD500] = useState<string>("");
  const [d200, setD200] = useState<string>("");
  const [d100, setD100] = useState<string>("");
  const [d50, setD50] = useState<string>("");
  const [d20, setD20] = useState<string>("");
  const [d10, setD10] = useState<string>("");
  const [coins, setCoins] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Payout form
  const [payoutAmount, setPayoutAmount] = useState<string>("");
  const [payoutReason, setPayoutReason] = useState<string>("");

  // Print slip ref
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch current drawer state
  const fetchCurrentDrawer = async () => {
    if (!restaurantId) return;
    try {
      setIsLoading(true);
      const res = await queryClient.fetchQuery({
        queryKey: cashierKeys.register(restaurantId),
        queryFn: () => posReportsService.getCurrentCashDrawer(restaurantId),
      });
      if (res.data) {
        setDrawerData(res.data);
        const closedZ = (res.data as any).lastClosedDrawer?.zReportData || res.data.drawer?.zReportData;
        if (closedZ) {
          setLatestClosedZReport(closedZ);
        }
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to load register state",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchCurrentDrawer();
    }
  }, [open, restaurantId]);

  // Denominations calculations
  const totalCountedCash = useMemo(() => {
    const sum500 = (Number(d500) || 0) * 500;
    const sum200 = (Number(d200) || 0) * 200;
    const sum100 = (Number(d100) || 0) * 100;
    const sum50 = (Number(d50) || 0) * 50;
    const sum20 = (Number(d20) || 0) * 20;
    const sum10 = (Number(d10) || 0) * 10;
    const sumCoins = Number(coins) || 0;
    return sum500 + sum200 + sum100 + sum50 + sum20 + sum10 + sumCoins;
  }, [d500, d200, d100, d50, d20, d10, coins]);

  // True only after the cashier has typed at least one denomination value
  const hasCounted = [d500, d200, d100, d50, d20, d10, coins].some((v) => v !== "" && v !== "0" && v !== undefined);

  const expectedCash = drawerData?.liveMetrics?.expectedCash || 0;
  // Only show shortage/excess after cashier has actually entered denomination counts
  const cashDifference = hasCounted ? totalCountedCash - expectedCash : null;

  // Handle Open Register
  const handleOpenRegister = async () => {
    try {
      setIsSubmitting(true);
      const res = await posReportsService.openCashDrawer(restaurantId, {
        openingCash: Number(openingFloatInput) || 0,
        shiftName: openingShiftName,
      });
      toast({
        title: "🔓 Register Session Opened",
        description: `Opening float of ₹${Number(openingFloatInput).toLocaleString("en-IN")} recorded.`,
      });
      await queryClient.invalidateQueries({ queryKey: cashierKeys.register(restaurantId) });
      await fetchCurrentDrawer();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error opening register",
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Petty Cash Payout
  const handleAddPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || Number(payoutAmount) <= 0 || !payoutReason.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please provide a valid payout amount and reason.",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      await posReportsService.addCashPayout(restaurantId, {
        amount: Number(payoutAmount),
        reason: payoutReason.trim(),
      });
      toast({
        title: "💸 Petty Cash Payout Recorded",
        description: `₹${Number(payoutAmount).toLocaleString("en-IN")} deducted for "${payoutReason}".`,
      });
      setPayoutAmount("");
      setPayoutReason("");
      await queryClient.invalidateQueries({ queryKey: cashierKeys.register(restaurantId) });
      await fetchCurrentDrawer();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error adding payout",
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Close Register & Generate Z-Report
  const handleCloseRegister = async () => {
    const openOrders = drawerData?.liveMetrics?.openOrdersCount || 0;
    if (openOrders > 0) {
      const confirmed = window.confirm(
        `⚠️ Warning: There are currently ${openOrders} open / unbilled tables on the floor. Are you sure you want to close the day's register now?`
      );
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);
      const denominations: DenominationCounts = {
        d500: Number(d500) || 0,
        d200: Number(d200) || 0,
        d100: Number(d100) || 0,
        d50: Number(d50) || 0,
        d20: Number(d20) || 0,
        d10: Number(d10) || 0,
        coins: Number(coins) || 0,
      };

      const res = await posReportsService.closeCashDrawer(restaurantId, {
        actualCashCounted: totalCountedCash,
        denominations,
        notes: notes.trim(),
      });

      toast({
        title: "🔒 Day-End / Z-Report Generated!",
        description: `Register closed successfully. Report #${res.data?.reportNumber || "Z-Report"}.`,
      });

      if (res.data?.zReportData) {
        setLatestClosedZReport(res.data.zReportData);
      }
      await queryClient.invalidateQueries({ queryKey: cashierKeys.register(restaurantId) });
      await fetchCurrentDrawer();
      setActiveTab("print");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error closing register",
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Print Action
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const win = window.open("", "_blank");
    if (!win) {
      toast({
        variant: "destructive",
        title: "Print Blocked",
        description: "Please allow popups to print the thermal Z-Report slip.",
      });
      return;
    }

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Z-Report - ${effectiveCafeName}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 76mm;
              margin: 2mm auto;
              padding: 0;
              color: #000;
              font-size: 11px;
              line-height: 1.25;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .flex-between { display: flex; justify-content: space-between; margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .double-divider { border-top: 2px solid #000; margin: 6px 0; }
            .section-title { font-weight: bold; text-align: center; background: #eee; padding: 2px 0; margin: 4px 0; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const isDrawerOpen = drawerData?.drawer?.status === "OPEN";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-6 shadow-2xl flex flex-col overflow-hidden">
        <DialogHeader className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-row items-center justify-between shrink-0 pr-6">
          <div>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Day-End / Z-Report (Register Close)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Daily sales, tax summary, cash float reconciliation &amp; physical counting
            </DialogDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs font-black px-2.5 py-1 ${
                isDrawerOpen
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-slate-500/10 text-slate-600 border-slate-500/30"
              }`}
            >
              {isDrawerOpen ? (
                <span className="flex items-center gap-1">
                  <Unlock className="w-3.5 h-3.5" /> REGISTER OPEN
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> REGISTER CLOSED
                </span>
              )}
            </Badge>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Loading register financials...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 pt-3">
            {/* Top KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 shrink-0">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Opening Float</p>
                <p className="text-base font-black text-slate-800 dark:text-slate-200">
                  ₹{(drawerData?.liveMetrics?.openingCash || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">+ Cash Collected</p>
                <p className="text-base font-black text-emerald-700 dark:text-emerald-300">
                  ₹{(drawerData?.liveMetrics?.cashSales || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">- Cash Payouts</p>
                <p className="text-base font-black text-rose-700 dark:text-rose-300">
                  ₹{(drawerData?.liveMetrics?.cashPayouts || 0).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">= Expected Cash</p>
                <p className="text-base font-black text-blue-700 dark:text-blue-300">
                  ₹{expectedCash.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Warning if Open Tables exist */}
            {isDrawerOpen && (drawerData?.liveMetrics?.openOrdersCount || 0) > 0 && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between shrink-0">
                <span className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  {drawerData?.liveMetrics?.openOrdersCount} Table(s) still open / unbilled (₹{drawerData?.liveMetrics?.openOrdersTotal?.toLocaleString("en-IN")}).
                </span>
                <span className="text-[11px] underline font-medium">Settle all open tables before closing</span>
              </div>
            )}

            {/* Tabs for Drawer Functions */}
            <Tabs
              value={activeTab}
              onValueChange={(val: any) => setActiveTab(val)}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="grid grid-cols-4 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl shrink-0 mb-3">
                <TabsTrigger value="reconciliation" className="rounded-xl text-xs font-bold gap-1.5">
                  <Coins className="w-3.5 h-3.5" /> Cash Count
                </TabsTrigger>
                <TabsTrigger value="financials" className="rounded-xl text-xs font-bold gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Financials &amp; Tax
                </TabsTrigger>
                <TabsTrigger value="payouts" className="rounded-xl text-xs font-bold gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Petty Cash ({drawerData?.drawer?.payouts?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="print" className="rounded-xl text-xs font-bold gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Z-Report Slip
                </TabsTrigger>
              </TabsList>

              {/* ── TAB 1: CASH RECONCILIATION & DENOMINATIONS ── */}
              <TabsContent value="reconciliation" className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
                {!isDrawerOpen ? (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Register is Currently Closed</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Enter the opening cash float in the drawer to begin today's shift and record orders.
                      </p>
                    </div>

                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="text-left space-y-1">
                        <Label className="text-xs font-bold">Opening Cash Float (₹)</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 2000"
                          value={openingFloatInput}
                          onChange={(e) => setOpeningFloatInput(e.target.value)}
                          className="h-10 text-sm font-bold text-center rounded-xl"
                        />
                      </div>

                      <Button
                        onClick={handleOpenRegister}
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl h-11 shadow-md gap-2"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                        Open Register &amp; Start Shift
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Denominations Grid */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                        <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                          Currency Denomination Calculator
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">Count physical cash in drawer</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        {/* 500 */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="w-12 font-bold text-slate-600 dark:text-slate-400">₹500 ×</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={d500}
                            onChange={(e) => setD500(e.target.value)}
                            className="h-8 text-xs font-bold text-center w-16"
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 ml-auto">
                            = ₹{((Number(d500) || 0) * 500).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* 200 */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="w-12 font-bold text-slate-600 dark:text-slate-400">₹200 ×</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={d200}
                            onChange={(e) => setD200(e.target.value)}
                            className="h-8 text-xs font-bold text-center w-16"
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 ml-auto">
                            = ₹{((Number(d200) || 0) * 200).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* 100 */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="w-12 font-bold text-slate-600 dark:text-slate-400">₹100 ×</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={d100}
                            onChange={(e) => setD100(e.target.value)}
                            className="h-8 text-xs font-bold text-center w-16"
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 ml-auto">
                            = ₹{((Number(d100) || 0) * 100).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* 50 */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="w-12 font-bold text-slate-600 dark:text-slate-400">₹50 ×</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={d50}
                            onChange={(e) => setD50(e.target.value)}
                            className="h-8 text-xs font-bold text-center w-16"
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 ml-auto">
                            = ₹{((Number(d50) || 0) * 50).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* 20 */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="w-12 font-bold text-slate-600 dark:text-slate-400">₹20 ×</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={d20}
                            onChange={(e) => setD20(e.target.value)}
                            className="h-8 text-xs font-bold text-center w-16"
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 ml-auto">
                            = ₹{((Number(d20) || 0) * 20).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* 10 */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <span className="w-12 font-bold text-slate-600 dark:text-slate-400">₹10 ×</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={d10}
                            onChange={(e) => setD10(e.target.value)}
                            className="h-8 text-xs font-bold text-center w-16"
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 ml-auto">
                            = ₹{((Number(d10) || 0) * 10).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Coins / Other */}
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 sm:col-span-2">
                          <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">Coins / Change (₹)</span>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={coins}
                            onChange={(e) => setCoins(e.target.value)}
                            className="h-8 text-xs font-bold text-center w-24"
                          />
                          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 ml-auto">
                            = ₹{(Number(coins) || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reconciliation Calculation Strip */}
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span>Total Actual Cash Counted:</span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
                          ₹{totalCountedCash.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span>Total System Expected Cash:</span>
                        <span className="text-base font-black text-slate-800 dark:text-slate-200">
                          ₹{expectedCash.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-wider">Cash Difference (Over / Short):</span>
                        <Badge
                          className={`text-xs font-extrabold px-3 py-1 ${
                            cashDifference === null
                              ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                              : cashDifference === 0
                              ? "bg-emerald-500 text-white"
                              : cashDifference < 0
                              ? "bg-rose-600 text-white"
                              : "bg-amber-500 text-slate-900"
                          }`}
                        >
                          {cashDifference === null ? (
                            <span className="flex items-center gap-1">
                              ⏳ Count your cash above first
                            </span>
                          ) : cashDifference === 0 ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> EXACT MATCH (₹0.00)
                            </span>
                          ) : cashDifference < 0 ? (
                            `⚠️ SHORTAGE: -₹${Math.abs(cashDifference).toLocaleString("en-IN")}`
                          ) : (
                            `🟢 EXCESS / OVER: +₹${cashDifference.toLocaleString("en-IN")}`
                          )}
                        </Badge>
                      </div>
                      <div className="pt-2">
                        <Label className="text-[11px] font-bold text-slate-500">Closing Notes / Discrepancy Reason</Label>
                        <Textarea
                          placeholder="Optional notes for shift handover or reason for cash variance..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="h-16 text-xs rounded-xl mt-1"
                        />
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="flex justify-end gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl font-bold text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCloseRegister}
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl px-5 h-10 shadow-md gap-2"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        Confirm &amp; Generate Z-Report
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ── TAB 2: FINANCIALS & TAX OVERVIEW ── */}
              <TabsContent value="financials" className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Live Operational Financials &amp; Dynamic Taxes
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Gross Sales</span>
                      <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                        ₹{(drawerData?.drawer?.zReportData?.salesSummary?.grossSales || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Net Sales (Revenue)</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{(drawerData?.drawer?.zReportData?.salesSummary?.netSales || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Total Discounts</span>
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                        ₹{(drawerData?.drawer?.zReportData?.salesSummary?.totalDiscounts || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">CGST (Collected)</span>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                        ₹{(drawerData?.drawer?.zReportData?.salesSummary?.totalCgst || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">SGST (Collected)</span>
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                        ₹{(drawerData?.drawer?.zReportData?.salesSummary?.totalSgst || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Total GST Amount</span>
                      <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        ₹{(drawerData?.drawer?.zReportData?.salesSummary?.totalTax || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tender Breakup */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Payment Tender Breakdown
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {(drawerData?.drawer?.zReportData?.paymentBreakdown || []).map((p) => (
                      <div key={p.method} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{p.method}</span>
                        <div className="flex justify-between items-baseline mt-0.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">₹{p.amount.toLocaleString("en-IN")}</span>
                          <span className="text-[10px] text-slate-400">({p.count} tx)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ── TAB 3: PETTY CASH & PAYOUTS ── */}
              <TabsContent value="payouts" className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
                <form onSubmit={handleAddPayout} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                    Add Petty Cash Payout (Drawer Outflow)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <Label className="text-[11px] font-bold text-slate-500">Amount (₹)</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 250"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="h-9 text-xs font-bold rounded-xl mt-1"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-[11px] font-bold text-slate-500">Reason / Description</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder="e.g. Milk & Ice purchase from local market"
                          value={payoutReason}
                          onChange={(e) => setPayoutReason(e.target.value)}
                          className="h-9 text-xs rounded-xl flex-1"
                          required
                        />
                        <Button
                          type="submit"
                          disabled={isSubmitting || !isDrawerOpen}
                          className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shrink-0 gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Deduct
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Payouts List */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                    Recorded Payouts in this Shift ({drawerData?.drawer?.payouts?.length || 0})
                  </h4>
                  {(!drawerData?.drawer?.payouts || drawerData.drawer.payouts.length === 0) ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No cash payouts recorded in this shift.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {drawerData.drawer.payouts.map((p, idx) => (
                        <div
                          key={p._id || idx}
                          className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{p.reason}</p>
                            <p className="text-[10px] text-slate-400">
                              By {p.createdBy?.contactName || "Staff"} • {p.createdAt ? format(new Date(p.createdAt), "HH:mm") : ""}
                            </p>
                          </div>
                          <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                            -₹{Number(p.amount).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── TAB 4: THERMAL Z-REPORT SLIP PREVIEW ── */}
              <TabsContent value="print" className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col items-center">
                <div className="w-full max-w-sm flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500">80mm POS Thermal Slip Preview</span>
                  <Button
                    onClick={handlePrint}
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Z-Report Slip
                  </Button>
                </div>

                {/* ── Printable Thermal Z-Report Box ── */}
                <div
                  ref={printRef}
                  className="w-full max-w-sm p-4 bg-white text-slate-900 border border-dashed border-slate-300 font-mono text-[11px] leading-tight shadow-md rounded-lg select-text"
                >
                  <div className="text-center pb-2">
                    <h2 className="text-sm font-black uppercase tracking-wider">{effectiveCafeName}</h2>
                    <p className="text-[10px] text-slate-600">POS DAY-END / Z-REPORT</p>
                    <p className="text-[10px] font-bold mt-0.5">
                      REPORT #{latestClosedZReport?.reportNumber || drawerData?.drawer?.reportNumber || "Z-0001"}
                    </p>
                  </div>

                  <div className="border-t border-dashed border-black my-1" />

                  <div className="flex justify-between">
                    <span>DATE: {format(new Date(), "dd/MM/yyyy HH:mm")}</span>
                    <span>SHIFT: {drawerData?.drawer?.shiftName || "FULL_DAY"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CASHIER: {userName}</span>
                    <span>ROLE: {userRole || "STAFF"}</span>
                  </div>

                  <div className="border-t border-dashed border-black my-1.5" />
                  <div className="text-center font-bold uppercase text-[10px] py-0.5 bg-slate-100">
                    -- SALES SUMMARY --
                  </div>

                  <div className="space-y-0.5 pt-1">
                    <div className="flex justify-between">
                      <span>GROSS SALES:</span>
                      <span>₹{(latestClosedZReport?.salesSummary?.grossSales || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>DISCOUNTS:</span>
                      <span>-₹{(latestClosedZReport?.salesSummary?.totalDiscounts || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST (TAX):</span>
                      <span>₹{(latestClosedZReport?.salesSummary?.totalCgst || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (TAX):</span>
                      <span>₹{(latestClosedZReport?.salesSummary?.totalSgst || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>TOTAL GST:</span>
                      <span>₹{(latestClosedZReport?.salesSummary?.totalTax || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-black my-1" />
                    <div className="flex justify-between font-black text-xs">
                      <span>NET REVENUE:</span>
                      <span>₹{(latestClosedZReport?.salesSummary?.netSales || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-700">
                      <span>COMPLETED ORDERS:</span>
                      <span>{latestClosedZReport?.salesSummary?.completedOrders || 0} ({latestClosedZReport?.salesSummary?.totalCovers || 0} pax)</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black my-1.5" />
                  <div className="text-center font-bold uppercase text-[10px] py-0.5 bg-slate-100">
                    -- TENDER BREAKUP --
                  </div>

                  <div className="space-y-0.5 pt-1">
                    {(latestClosedZReport?.paymentBreakdown || []).map((p) => (
                      <div key={p.method} className="flex justify-between">
                        <span>{p.method.toUpperCase()} PAID:</span>
                        <span>₹{p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-amber-900">
                      <span>CREDIT / KHATA DUES:</span>
                      <span>₹{(latestClosedZReport?.salesSummary?.dueAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black my-1.5" />
                  <div className="text-center font-bold uppercase text-[10px] py-0.5 bg-slate-100">
                    -- CASH RECONCILIATION --
                  </div>

                  <div className="space-y-0.5 pt-1">
                    <div className="flex justify-between">
                      <span>OPENING FLOAT:</span>
                      <span>₹{(latestClosedZReport?.cashReconciliation?.openingCash || drawerData?.liveMetrics?.openingCash || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ CASH SALES:</span>
                      <span>₹{(latestClosedZReport?.cashReconciliation?.cashSales || drawerData?.liveMetrics?.cashSales || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>- PETTY PAYOUTS:</span>
                      <span>-₹{(latestClosedZReport?.cashReconciliation?.cashPayouts || drawerData?.liveMetrics?.cashPayouts || 0).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-dotted border-black my-0.5" />
                    <div className="flex justify-between font-bold">
                      <span>= EXPECTED CASH:</span>
                      <span>₹{(latestClosedZReport?.cashReconciliation?.expectedCash || expectedCash).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>ACTUAL COUNTED:</span>
                      <span>₹{(latestClosedZReport?.cashReconciliation?.actualCashCounted || totalCountedCash).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-black my-0.5" />
                    <div className="flex justify-between font-black">
                      <span>VARIANCE (DIFF):</span>
                      <span>
                        {(() => {
                          const diff = latestClosedZReport?.cashReconciliation?.difference ?? (cashDifference ?? 0);
                          return `${diff >= 0 ? "+" : ""}₹${diff.toFixed(2)}`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {notes && (
                    <div className="mt-2 p-1.5 border border-dotted border-black text-[9px]">
                      <strong>NOTES:</strong> {notes}
                    </div>
                  )}

                  {/* Signatures */}
                  <div className="pt-4 pb-1 text-[9px] space-y-3">
                    <div className="flex justify-between items-end gap-4">
                      <div className="flex-1 border-t border-black border-dotted pt-1 text-center">
                        CASHIER SIGN
                      </div>
                      <div className="flex-1 border-t border-black border-dotted pt-1 text-center">
                        MANAGER SIGN
                      </div>
                    </div>
                    <div className="text-center text-[8px] text-slate-500">
                      *** END OF DAY REGISTER CLOSE ***
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
