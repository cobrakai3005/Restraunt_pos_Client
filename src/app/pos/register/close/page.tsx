"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { CashDrawerSession } from "@/services/posReports.service";
import { useRegisterCloseState } from "./use-register-close-state";
import {
  Calculator,
  Printer,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
  FileSpreadsheet,
  Coins,
  Lock,
  Unlock,
  Loader2,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  History,
  Calendar,
  Eye,
} from "lucide-react";

export default function CloseRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const {
    user,
    activeTab,
    setActiveTab,
    isLoading,
    isSubmitting,
    drawerData,
    showConfirmModal,
    setShowConfirmModal,
    zReportsList,
    selectedHistoryReport,
    setSelectedHistoryReport,
    historyStartDate,
    setHistoryStartDate,
    historyEndDate,
    setHistoryEndDate,
    openingFloatInput,
    setOpeningFloatInput,
    openingShiftName,
    setOpeningShiftName,
    d500,
    setD500,
    d200,
    setD200,
    d100,
    setD100,
    d50,
    setD50,
    d20,
    setD20,
    d10,
    setD10,
    coins,
    setCoins,
    notes,
    setNotes,
    payoutAmount,
    setPayoutAmount,
    payoutReason,
    setPayoutReason,
    isDrawerOpen,
    countedDenominationsTotal,
    expectedCash,
    cashDifference,
    effectiveCafeName,
    activeZData,
    fetchDrawerData,
    fetchZReports,
    handleOpenDrawer,
    handleAddPayout,
    handleConfirmClose,
  } = useRegisterCloseState();

  // Address formatter helper
  const formatAddress = (addr: any): string => {
    if (!addr) return "";
    if (typeof addr === "string") return addr;
    if (typeof addr === "object") {
      return [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(", ");
    }
    return "";
  };

  // Direct Browser Print for Current Active Slip
  const handlePrintSlip = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=380,height=700");
    if (!printWindow) {
      return toast({ variant: "destructive", title: "Popup Blocked", description: "Please allow popups to print receipt." });
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Z-Report Slip</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              margin: 0;
              padding: 8px;
              width: 72mm;
              line-height: 1.25;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .border-t { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
            .double-border-b { border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 4px; }
            .flex-row { display: flex; justify-content: space-between; margin: 2px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Print Specific Historical Shift Slip
  const handlePrintHistorySlip = (report: CashDrawerSession) => {
    const cafeName = report.zReportData?.restaurant?.name || effectiveCafeName;
    const cafeAddr = formatAddress(report.zReportData?.restaurant?.address);
    const z = report.zReportData;

    const printWindow = window.open("", "_blank", "width=380,height=700");
    if (!printWindow) {
      return toast({ variant: "destructive", title: "Popup Blocked", description: "Please allow popups to print receipt." });
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Historical Z-Report ${report.reportNumber || ""}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              color: #000;
              margin: 0;
              padding: 8px;
              width: 72mm;
              line-height: 1.25;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; padding-bottom: 4px; margin-bottom: 4px; }
            .border-t { border-top: 1px dashed #000; padding-top: 4px; margin-top: 4px; }
            .double-border-b { border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 4px; }
            .flex-row { display: flex; justify-content: space-between; margin: 2px 0; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="text-center pb-2 border-b">
            <div style="font-size:14px; font-weight:bold; text-transform:uppercase;">${cafeName}</div>
            ${cafeAddr ? `<div style="font-size:10px; color:#555;">${cafeAddr}</div>` : ""}
            <div style="font-size:12px; font-weight:bold; margin-top:4px;">*** SHIFT Z-REPORT ***</div>
            <div style="font-size:11px; font-weight:bold;">REPORT #${report.reportNumber || "Z-0001"}</div>
          </div>

          <div style="padding:4px 0;" class="border-b">
            <div class="flex-row"><span>SHIFT:</span><span class="font-bold">${report.shiftName}</span></div>
            <div class="flex-row"><span>DATE:</span><span>${format(new Date(report.shiftDate), "dd-MMM-yyyy")}</span></div>
            <div class="flex-row"><span>OPENED BY:</span><span>${report.openedBy?.contactName || report.openedBy?.username || "Cashier"}</span></div>
            <div class="flex-row"><span>CLOSED BY:</span><span>${report.closedBy?.contactName || report.closedBy?.username || "Manager"}</span></div>
          </div>

          <div style="padding:4px 0;" class="border-b">
            <div class="font-bold text-center" style="text-decoration:underline; margin-bottom:2px;">CASH RECONCILIATION</div>
            <div class="flex-row"><span>(+) OPENING FLOAT:</span><span>₹${(report.openingCash || 0).toFixed(2)}</span></div>
            <div class="flex-row"><span>(+) CASH SALES:</span><span>₹${(report.cashSales || 0).toFixed(2)}</span></div>
            <div class="flex-row"><span>(-) PETTY PAYOUTS:</span><span>-₹${(report.cashPayouts || 0).toFixed(2)}</span></div>
            <div class="flex-row font-bold border-t" style="margin-top:2px; padding-top:2px;"><span>(=) EXPECTED CASH:</span><span>₹${(report.expectedCash || 0).toFixed(2)}</span></div>
            <div class="flex-row font-bold" style="font-size:12px;"><span>ACTUAL COUNTED:</span><span>₹${(report.actualCashCounted || 0).toFixed(2)}</span></div>
            <div class="flex-row font-bold border-t" style="margin-top:2px; padding-top:2px;">
              <span>DIFFERENCE:</span>
              <span>${(report.difference || 0) >= 0 ? `+₹${(report.difference || 0).toFixed(2)} (OK/SURPLUS)` : `-₹${Math.abs(report.difference || 0).toFixed(2)} (SHORTAGE)`}</span>
            </div>
          </div>

          ${z?.salesSummary ? `
          <div style="padding:4px 0;" class="border-b">
            <div class="font-bold text-center" style="text-decoration:underline; margin-bottom:2px;">SHIFT SALES & TAX</div>
            <div class="flex-row"><span>GROSS SALES:</span><span>₹${(z.salesSummary.grossSales || 0).toFixed(2)}</span></div>
            <div class="flex-row"><span>DISCOUNTS:</span><span>-₹${(z.salesSummary.totalDiscounts || 0).toFixed(2)}</span></div>
            <div class="flex-row font-bold"><span>NET SALES:</span><span>₹${(z.salesSummary.netSales || 0).toFixed(2)}</span></div>
            <div class="flex-row"><span>TAX (GST):</span><span>₹${(z.salesSummary.totalTax || 0).toFixed(2)}</span></div>
            <div class="flex-row"><span>TOTAL GUESTS (COVERS):</span><span>${z.salesSummary.totalCovers || 0}</span></div>
          </div>
          ` : ""}

          <div class="text-center" style="padding-top:6px; font-size:10px; color:#555;">
            <div>* OFFICIAL AUDIT COPY *</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Render Full Page Skeleton while loading initial drawer state
  if (isLoading && !drawerData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
        {/* Header Skeleton */}
        <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-56 rounded-md" />
              <Skeleton className="h-3.5 w-40 rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top 4 KPI Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Skeleton className="h-24 rounded-2xl bg-slate-200/70 dark:bg-slate-900" />
            <Skeleton className="h-24 rounded-2xl bg-slate-200/70 dark:bg-slate-900" />
            <Skeleton className="h-24 rounded-2xl bg-slate-200/70 dark:bg-slate-900" />
            <Skeleton className="h-24 rounded-2xl bg-slate-200/70 dark:bg-slate-900" />
          </div>

          {/* Tab Bar Skeleton */}
          <Skeleton className="h-12 w-full rounded-2xl bg-slate-200/70 dark:bg-slate-900" />

          {/* Grid Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Denominations Counter Card Skeleton */}
            <div className="lg:col-span-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="space-y-2">
                <Skeleton className="h-5 w-60 rounded-md" />
                <Skeleton className="h-3.5 w-80 rounded-md" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800/80" />
                ))}
                <Skeleton className="h-24 rounded-xl col-span-2 bg-slate-100 dark:bg-slate-800/80" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-20 w-full rounded-xl bg-slate-100 dark:bg-slate-800/80" />
              </div>
            </div>

            {/* Right Col: Reconciliation Summary Card Skeleton */}
            <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 rounded-2xl space-y-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <Skeleton className="h-5 w-44 rounded-md" />
                <div className="space-y-3 py-2">
                  <Skeleton className="h-5 w-full rounded-md" />
                  <Skeleton className="h-5 w-full rounded-md" />
                  <Skeleton className="h-5 w-full rounded-md" />
                  <Skeleton className="h-6 w-full rounded-md" />
                  <Skeleton className="h-7 w-full rounded-md" />
                </div>
                <Skeleton className="h-16 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80" />
              </div>

              <div className="space-y-2.5 pt-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <header className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/employee")}
            className="h-10 px-3 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl gap-2 font-bold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to POS
          </Button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                Register Day-End & Z-Report
              </h1>
              <Badge
                className={
                  isDrawerOpen
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs font-bold"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-mono text-xs font-bold"
                }
              >
                {isDrawerOpen ? "🟢 REGISTER OPEN" : "🔴 REGISTER CLOSED"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {effectiveCafeName} • Cashier: <strong className="text-slate-700 dark:text-slate-200">{user?.contactName || user?.username || "Cashier"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {drawerData?.liveMetrics?.openOrdersCount ? (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs py-1 px-2.5 flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {drawerData.liveMetrics.openOrdersCount} Open Tables (₹{drawerData.liveMetrics.openOrdersTotal.toFixed(2)})
            </Badge>
          ) : null}

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              fetchDrawerData();
              fetchZReports();
            }}
            disabled={isLoading}
            className="h-10 w-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl shadow-sm"
            title="Refresh Live Metrics"
          >
            <RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          {isDrawerOpen && (
            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="h-10 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold px-4 rounded-xl shadow-md gap-2 text-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Close Shift & Print</span>
              <span className="sm:hidden">Close</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 rounded-2xl shadow-sm">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">1. Opening Float</div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              ₹{(drawerData?.liveMetrics?.openingCash || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Starting cash float</div>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 rounded-2xl shadow-sm">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">2. Cash Collected</div>
            <div className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              +₹{(drawerData?.liveMetrics?.cashSales || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Live customer cash sales</div>
          </Card>

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 rounded-2xl shadow-sm">
            <div className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">3. Petty Payouts</div>
            <div className="text-2xl lg:text-3xl font-black text-red-600 dark:text-red-400 mt-1 font-mono">
              -₹{(drawerData?.liveMetrics?.cashPayouts || 0).toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Cash taken out for expenses</div>
          </Card>

          <Card className="border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-2xl shadow-sm">
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">4. Expected in Drawer</div>
            <div className="text-2xl lg:text-3xl font-black text-blue-700 dark:text-blue-400 mt-1 font-mono">
              ₹{expectedCash.toFixed(2)}
            </div>
            <div className="text-[11px] text-blue-600/70 dark:text-blue-300/70 mt-1">Float + Sales - Payouts</div>
          </Card>
        </div>

        {/* If Register is CLOSED: Banner to Open Register */}
        {!isDrawerOpen && (
          <Card className="border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/5 p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active Cash Register Session</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Open a new register session with a starting cash float to begin accepting cash orders.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Opening Float (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={openingFloatInput}
                  onChange={(e) => setOpeningFloatInput(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-base rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Shift Type</Label>
                <select
                  value={openingShiftName}
                  onChange={(e: any) => setOpeningShiftName(e.target.value)}
                  className="h-11 w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm px-3 focus:outline-none"
                >
                  <option value="MORNING">Morning Shift</option>
                  <option value="EVENING">Evening Shift</option>
                  <option value="NIGHT">Night Shift</option>
                  <option value="FULL_DAY">Full Day</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={handleOpenDrawer}
                  disabled={isSubmitting}
                  className="h-11 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                  Open Shift / Register
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tabbed Workspace */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
          <TabsList className="bg-slate-200/80 dark:bg-slate-950 p-1.5 border border-slate-200 dark:border-slate-800 rounded-2xl grid grid-cols-5 h-auto shadow-inner">
            <TabsTrigger
              value="reconciliation"
              className="py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 text-xs font-bold gap-1.5 transition-all"
            >
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Cash Reconciliation</span>
              <span className="sm:hidden">Cash</span>
            </TabsTrigger>
            <TabsTrigger
              value="financials"
              className="py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 text-xs font-bold gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Financials & Tax</span>
              <span className="sm:hidden">Tax</span>
            </TabsTrigger>
            <TabsTrigger
              value="payouts"
              className="py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 text-xs font-bold gap-1.5 transition-all"
            >
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Petty Cash ({drawerData?.drawer?.payouts?.length || 0})</span>
              <span className="sm:hidden">Payouts</span>
            </TabsTrigger>
            <TabsTrigger
              value="print"
              className="py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 text-xs font-bold gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Z-Report Slip</span>
              <span className="sm:hidden">Slip</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 text-xs font-bold gap-1.5 transition-all"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Shift History ({zReportsList.length})</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CASH RECONCILIATION & DENOMINATIONS */}
          <TabsContent value="reconciliation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Denomination Counter */}
              <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 rounded-2xl space-y-6 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Coins className="w-5 h-5 text-amber-500" />
                    Physical Cash Denomination Counter
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Count notes and coins currently in the physical cash drawer.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">₹500 Notes</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={d500}
                      onChange={(e) => setD500(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center font-bold"
                    />
                    <div className="text-[11px] text-right text-slate-500 font-mono">
                      = ₹{((parseInt(d500) || 0) * 500).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">₹200 Notes</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={d200}
                      onChange={(e) => setD200(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center font-bold"
                    />
                    <div className="text-[11px] text-right text-slate-500 font-mono">
                      = ₹{((parseInt(d200) || 0) * 200).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">₹100 Notes</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={d100}
                      onChange={(e) => setD100(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center font-bold"
                    />
                    <div className="text-[11px] text-right text-slate-500 font-mono">
                      = ₹{((parseInt(d100) || 0) * 100).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">₹50 Notes</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={d50}
                      onChange={(e) => setD50(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center font-bold"
                    />
                    <div className="text-[11px] text-right text-slate-500 font-mono">
                      = ₹{((parseInt(d50) || 0) * 50).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">₹20 Notes</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={d20}
                      onChange={(e) => setD20(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center font-bold"
                    />
                    <div className="text-[11px] text-right text-slate-500 font-mono">
                      = ₹{((parseInt(d20) || 0) * 20).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">₹10 Notes</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={d10}
                      onChange={(e) => setD10(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center font-bold"
                    />
                    <div className="text-[11px] text-right text-slate-500 font-mono">
                      = ₹{((parseInt(d10) || 0) * 10).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 col-span-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Coins & Loose Cash (₹ Total)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={coins}
                      onChange={(e) => setCoins(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-center font-bold"
                    />
                    <div className="text-[11px] text-right text-slate-500 font-mono">
                      = ₹{(parseFloat(coins) || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shift Notes & Observations</Label>
                  <Textarea
                    placeholder="Enter any variance notes, manager signoff, or handover comments..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm rounded-xl"
                    rows={3}
                  />
                </div>
              </Card>

              {/* Right Col: Integrated Control & Summary Card */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 rounded-2xl flex flex-col justify-between space-y-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Reconciliation Summary
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-sm py-1 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400">Opening Float:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">₹{(drawerData?.liveMetrics?.openingCash || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm py-1 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400">+ Cash Collected:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+₹{(drawerData?.liveMetrics?.cashSales || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm py-1 border-b border-slate-200 dark:border-slate-800/80">
                      <span className="text-slate-500 dark:text-slate-400">- Petty Payouts:</span>
                      <span className="font-mono font-bold text-red-600 dark:text-red-400">-₹{(drawerData?.liveMetrics?.cashPayouts || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-base py-1.5 border-b border-slate-200 dark:border-slate-700 font-bold">
                      <span className="text-slate-700 dark:text-slate-200">Expected in Drawer:</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">₹{expectedCash.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-lg py-1.5 font-black">
                      <span className="text-slate-900 dark:text-white">Actual Counted:</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">₹{countedDenominationsTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Variance Status Pill */}
                  <div
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                      cashDifference === 0
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : cashDifference > 0
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                        : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {cashDifference === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : cashDifference > 0 ? (
                      <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider">
                        {cashDifference === 0
                          ? "100% Balanced Register"
                          : cashDifference > 0
                          ? "Excess / Surplus Cash"
                          : "Cash Shortage / Deficit"}
                      </div>
                      <div className="text-base font-black font-mono">
                        {cashDifference === 0
                          ? "₹0.00 (Exact Match)"
                          : cashDifference > 0
                          ? `+₹${cashDifference.toFixed(2)} (Excess)`
                          : `-₹${Math.abs(cashDifference).toFixed(2)} (Shortage)`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Action Section */}
                <div className="space-y-2.5 pt-2">
                  {isDrawerOpen ? (
                    <Button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isSubmitting}
                      className="w-full h-12 bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black rounded-xl shadow-md gap-2 text-sm"
                    >
                      <Lock className="w-4 h-4" />
                      Print Z-Report & Close Register
                    </Button>
                  ) : (
                    <Button
                      onClick={handleOpenDrawer}
                      disabled={isSubmitting}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md gap-2 text-sm"
                    >
                      <Unlock className="w-4 h-4" />
                      Open New Register Shift
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={() => router.push("/employee")}
                    className="w-full h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-xs"
                  >
                    Cancel & Return to POS
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: FINANCIALS & TAX BREAKDOWN */}
          <TabsContent value="financials" className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 rounded-2xl space-y-6 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
                  Shift Financials & Tender Summary
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comprehensive sales, discount, tax, and multi-tender breakdown for this shift.
                </p>
              </div>

              {drawerData?.drawer?.zReportData?.salesSummary ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Gross Sales</div>
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                      ₹{(drawerData.drawer.zReportData.salesSummary.grossSales || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Discounts Given</div>
                    <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                      ₹{(drawerData.drawer.zReportData.salesSummary.totalDiscounts || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Net Sales</div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      ₹{(drawerData.drawer.zReportData.salesSummary.netSales || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Tax (CGST+SGST)</div>
                    <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                      ₹{(drawerData.drawer.zReportData.salesSummary.totalTax || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Complete sales & tax compilation will be finalized upon Z-Report closing.
                </div>
              )}
            </Card>
          </TabsContent>

          {/* TAB 3: PETTY CASH PAYOUTS */}
          <TabsContent value="payouts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form to add payout */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 rounded-2xl space-y-4 shadow-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-emerald-500" />
                    Record Petty Cash Payout
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Log cash taken out from drawer for dairy, ice, supplies, or tips.
                  </p>
                </div>

                <form onSubmit={handleAddPayout} className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 150"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason / Expense Description</Label>
                    <Input
                      placeholder="e.g. Bought emergency lemons and ice"
                      value={payoutReason}
                      onChange={(e) => setPayoutReason(e.target.value)}
                      className="h-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || !isDrawerOpen}
                    className="w-full h-10 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl gap-2 shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Record Payout
                  </Button>
                </form>
              </Card>

              {/* List of payouts */}
              <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Shift Payouts Ledger</h3>

                {(!drawerData?.drawer?.payouts || drawerData.drawer.payouts.length === 0) ? (
                  <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                    No petty cash payouts logged for this shift.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {drawerData.drawer.payouts.map((p, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{p.reason}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {format(new Date(p.createdAt || new Date()), "dd MMM, hh:mm a")} • Logged by: {p.createdBy?.contactName || p.createdBy?.username || "Staff"}
                          </div>
                        </div>
                        <div className="font-mono font-black text-red-600 dark:text-red-400 text-base">
                          -₹{p.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: Z-REPORT THERMAL SLIP PREVIEW & PRINT */}
          <TabsContent value="print" className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 rounded-2xl flex flex-col items-center space-y-6 shadow-sm">
              <div className="flex items-center justify-between w-full max-w-sm">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">80mm Z-Report Slip Preview</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Standard POS thermal receipt</p>
                </div>
                <Button
                  onClick={handlePrintSlip}
                  className="h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print Thermal Slip
                </Button>
              </div>

              {/* Printable Slip Preview Container */}
              <div
                ref={printRef}
                className="w-full max-w-[340px] bg-white text-black p-5 rounded-xl shadow-2xl font-mono text-xs leading-tight border border-slate-300"
              >
                <div className="text-center pb-2 border-b border-black">
                  <div className="text-base font-black uppercase">{effectiveCafeName}</div>
                  {formatAddress(activeZData?.restaurant?.address) && <div className="text-[10px] text-gray-600">{formatAddress(activeZData?.restaurant?.address)}</div>}
                  {activeZData?.restaurant?.gstin && <div className="text-[10px] font-bold">GSTIN: {activeZData.restaurant.gstin}</div>}
                  <div className="text-sm font-black mt-1">*** END OF DAY (Z-REPORT) ***</div>
                  <div className="text-[11px] font-bold">REPORT #{activeZData?.reportNumber || "Z-DRAFT"}</div>
                </div>

                <div className="py-2 border-b border-black space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>SHIFT:</span>
                    <span className="font-bold">{activeZData?.shift?.name || "FULL_DAY"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{format(new Date(activeZData?.shift?.shiftDate || new Date()), "dd-MMM-yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PRINTED AT:</span>
                    <span>{format(new Date(), "dd-MMM-yyyy hh:mm a")}</span>
                  </div>
                </div>

                {/* Cash Reconciliation */}
                <div className="py-2 border-b border-black space-y-1">
                  <div className="font-bold text-center underline mb-1">CASH RECONCILIATION</div>
                  <div className="flex justify-between">
                    <span>(+) OPENING FLOAT:</span>
                    <span className="font-bold">₹{(activeZData?.cashReconciliation?.openingCash || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(+) CASH SALES:</span>
                    <span className="font-bold">₹{(activeZData?.cashReconciliation?.cashSales || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>(-) PETTY PAYOUTS:</span>
                    <span className="font-bold">-₹{(activeZData?.cashReconciliation?.cashPayouts || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-dashed border-black">
                    <span>(=) EXPECTED CASH:</span>
                    <span>₹{(activeZData?.cashReconciliation?.expectedCash || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm">
                    <span>ACTUAL COUNTED:</span>
                    <span>₹{(activeZData?.cashReconciliation?.actualCashCounted || countedDenominationsTotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-black">
                    <span>DIFFERENCE:</span>
                    <span>
                      {(activeZData?.cashReconciliation?.difference || cashDifference) >= 0
                        ? `+₹${(activeZData?.cashReconciliation?.difference || cashDifference).toFixed(2)} (OK/EXCESS)`
                        : `-₹${Math.abs(activeZData?.cashReconciliation?.difference || cashDifference).toFixed(2)} (SHORTAGE)`}
                    </span>
                  </div>
                </div>

                <div className="text-center pt-3 text-[10px] text-gray-700">
                  <div>* SYSTEM GENERATED Z-REPORT *</div>
                  <div>Thank you for your hard work!</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 5: SHIFT HISTORY & PAST Z-REPORTS */}
          <TabsContent value="history" className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 rounded-2xl space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-500" />
                    Past Shift Business Reports (Z-Reports)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    View full business details, cash balance, and reprint official receipts for every past shift.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={historyStartDate}
                    onChange={(e) => setHistoryStartDate(e.target.value)}
                    className="h-9 text-xs w-36 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <Input
                    type="date"
                    value={historyEndDate}
                    onChange={(e) => setHistoryEndDate(e.target.value)}
                    className="h-9 text-xs w-36 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              {zReportsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
                  No historical closed shift reports found for the selected period.
                </div>
              ) : (
                <div className="space-y-3">
                  {zReportsList.map((r, idx) => {
                    const hasSurplus = (r.difference || 0) >= 0;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-500/40 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-blue-600 dark:text-blue-400">
                              {r.reportNumber || `Z-${String(idx + 1).padStart(4, "0")}`}
                            </span>
                            <Badge variant="outline" className="text-[10px] font-bold">
                              {r.shiftName || "FULL_DAY"}
                            </Badge>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {format(new Date(r.shiftDate), "dd MMM yyyy")}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Cashier: <strong className="text-slate-700 dark:text-slate-300">{r.openedBy?.contactName || r.openedBy?.username || "Staff"}</strong> • Closed: {r.closedAt ? format(new Date(r.closedAt), "hh:mm a") : "Closed"}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div>
                            <span className="text-slate-400">Opening Float:</span>{" "}
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">₹{(r.openingCash || 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Cash Sales:</span>{" "}
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+₹{(r.cashSales || 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Expected:</span>{" "}
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">₹{(r.expectedCash || 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Counted:</span>{" "}
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">₹{(r.actualCashCounted || 0).toFixed(2)}</span>
                          </div>
                          <div>
                            <Badge
                              className={`text-[10px] font-mono font-bold ${
                                r.difference === 0
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : hasSurplus
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                  : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                              }`}
                            >
                              {r.difference === 0
                                ? "Matched"
                                : hasSurplus
                                ? `+₹${(r.difference || 0).toFixed(2)}`
                                : `-₹${Math.abs(r.difference || 0).toFixed(2)}`}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedHistoryReport(r)}
                            className="h-8 text-xs font-bold gap-1 border-slate-200 dark:border-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePrintHistorySlip(r)}
                            className="h-8 text-xs font-bold gap-1 bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Slip
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Historical Report Inspection Modal */}
      <Dialog open={!!selectedHistoryReport} onOpenChange={(open) => !open && setSelectedHistoryReport(null)}>
        <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-base font-bold">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                Shift Report #{selectedHistoryReport?.reportNumber || "Z-REPORT"}
              </span>
              <Badge variant="outline">{selectedHistoryReport?.shiftName || "FULL_DAY"}</Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Shift Date: {selectedHistoryReport?.shiftDate ? format(new Date(selectedHistoryReport.shiftDate), "dd MMMM yyyy") : ""}
            </DialogDescription>
          </DialogHeader>

          {selectedHistoryReport && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-400">Opening Float</div>
                  <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    ₹{(selectedHistoryReport.openingCash || 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-emerald-500 font-semibold">Cash Sales</div>
                  <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                    +₹{(selectedHistoryReport.cashSales || 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-red-500 font-semibold">Petty Payouts</div>
                  <div className="font-mono font-bold text-sm text-red-600 dark:text-red-400 mt-0.5">
                    -₹{(selectedHistoryReport.cashPayouts || 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-blue-500 font-semibold">Actual Counted</div>
                  <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 mt-0.5">
                    ₹{(selectedHistoryReport.actualCashCounted || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              {selectedHistoryReport.zReportData?.salesSummary && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Sales & Tax Compilation</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <div>Gross Sales: <strong className="font-mono">₹{(selectedHistoryReport.zReportData.salesSummary.grossSales || 0).toFixed(2)}</strong></div>
                    <div>Net Sales: <strong className="font-mono text-emerald-600">₹{(selectedHistoryReport.zReportData.salesSummary.netSales || 0).toFixed(2)}</strong></div>
                    <div>Total Tax: <strong className="font-mono text-blue-600">₹{(selectedHistoryReport.zReportData.salesSummary.totalTax || 0).toFixed(2)}</strong></div>
                    <div>Discounts: <strong className="font-mono text-amber-600">₹{(selectedHistoryReport.zReportData.salesSummary.totalDiscounts || 0).toFixed(2)}</strong></div>
                    <div>Total Covers: <strong>{selectedHistoryReport.zReportData.salesSummary.totalCovers || 0}</strong></div>
                    <div>Completed Orders: <strong>{selectedHistoryReport.zReportData.salesSummary.completedOrders || 0}</strong></div>
                  </div>
                </div>
              )}

              {selectedHistoryReport.notes && (
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-slate-700 dark:text-slate-300">
                  <strong className="text-amber-600 dark:text-amber-400">Shift Notes:</strong> {selectedHistoryReport.notes}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedHistoryReport(null)}
              className="border-slate-200 dark:border-slate-700"
            >
              Close
            </Button>
            {selectedHistoryReport && (
              <Button
                size="sm"
                onClick={() => handlePrintHistorySlip(selectedHistoryReport)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print 80mm Slip
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-lg font-bold">
              <ShieldAlert className="w-5 h-5" />
              Confirm Register Closing & Z-Report
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 text-xs">
              Closing the register will finalize today's shift and lock financial totals for Z-Report generation. This action is irreversible.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Expected Cash:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">₹{expectedCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Actual Counted:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">₹{countedDenominationsTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold">
              <span className="text-slate-700 dark:text-slate-300">Variance:</span>
              <span
                className={`font-mono ${
                  cashDifference === 0 ? "text-emerald-600 dark:text-emerald-400" : cashDifference > 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {cashDifference >= 0 ? `+₹${cashDifference.toFixed(2)}` : `-₹${Math.abs(cashDifference).toFixed(2)}`}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmClose}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl gap-2 shadow-md"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Yes, Finalize & Lock Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
