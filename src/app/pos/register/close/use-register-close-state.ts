"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { authService, User } from "@/services/auth.service";
import {
  posReportsService,
  CashDrawerSession,
  CurrentDrawerResponse,
  DenominationCounts,
  ZReportData,
} from "@/services/posReports.service";

export type RegisterTab = "reconciliation" | "financials" | "payouts" | "print" | "history";

export const formatRegisterAddress = (address: any): string => {
  if (!address) return "";
  if (typeof address === "string") return address;
  return [address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean).join(", ");
};

export function useRegisterCloseState() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [restaurantId, setRestaurantId] = useState("");
  const [activeTab, setActiveTab] = useState<RegisterTab>("reconciliation");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawerData, setDrawerData] = useState<CurrentDrawerResponse | null>(null);
  const [latestClosedZReport, setLatestClosedZReport] = useState<ZReportData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [zReportsList, setZReportsList] = useState<CashDrawerSession[]>([]);
  const [selectedHistoryReport, setSelectedHistoryReport] = useState<CashDrawerSession | null>(null);
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [openingFloatInput, setOpeningFloatInput] = useState("0");
  const [openingShiftName, setOpeningShiftName] = useState<"MORNING" | "EVENING" | "NIGHT" | "FULL_DAY">("FULL_DAY");
  const [d500, setD500] = useState("");
  const [d200, setD200] = useState("");
  const [d100, setD100] = useState("");
  const [d50, setD50] = useState("");
  const [d20, setD20] = useState("");
  const [d10, setD10] = useState("");
  const [coins, setCoins] = useState("");
  const [notes, setNotes] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutReason, setPayoutReason] = useState("");

  useEffect(() => {
    authService.getMe().then((currentUser) => {
      if (!currentUser?.restaurantId) {
        router.push("/employee-login");
        return;
      }
      setUser(currentUser);
      setRestaurantId(typeof currentUser.restaurantId === "object" ? (currentUser.restaurantId as any)._id : currentUser.restaurantId);
    }).catch(() => router.push("/employee-login"));
  }, [router]);

  const fetchDrawerData = async () => {
    if (!restaurantId) return;
    try {
      setIsLoading(true);
      const response = await posReportsService.getCurrentCashDrawer(restaurantId);
      if (response?.data) {
        setDrawerData(response.data);
        setLatestClosedZReport(
          response.data.drawer?.status === "CLOSED" && response.data.drawer?.zReportData
            ? response.data.drawer.zReportData
            : response.data.lastClosedDrawer?.zReportData || null,
        );
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to load cash drawer", description: error.response?.data?.message || error.message || "Please check connection" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZReports = async () => {
    if (!restaurantId) return;
    try {
      const response = await posReportsService.getZReports(restaurantId, historyStartDate || undefined, historyEndDate || undefined);
      if (response?.data) setZReportsList(response.data);
    } catch (error) {
      console.error("Failed to load Z-Reports", error);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchDrawerData();
      fetchZReports();
    }
  }, [restaurantId, historyStartDate, historyEndDate]);

  const countedDenominationsTotal = useMemo(() =>
    (parseInt(d500) || 0) * 500 + (parseInt(d200) || 0) * 200 + (parseInt(d100) || 0) * 100 +
    (parseInt(d50) || 0) * 50 + (parseInt(d20) || 0) * 20 + (parseInt(d10) || 0) * 10 + (parseFloat(coins) || 0),
  [d500, d200, d100, d50, d20, d10, coins]);

  const isDrawerOpen = drawerData?.drawer?.status === "OPEN";
  const expectedCash = drawerData?.liveMetrics?.expectedCash || 0;
  const cashDifference = countedDenominationsTotal - expectedCash;
  const denominations = (): DenominationCounts => ({
    d500: parseInt(d500) || 0, d200: parseInt(d200) || 0, d100: parseInt(d100) || 0,
    d50: parseInt(d50) || 0, d20: parseInt(d20) || 0, d10: parseInt(d10) || 0, coins: parseFloat(coins) || 0,
  });
  const effectiveCafeName = latestClosedZReport?.restaurant?.name || drawerData?.drawer?.zReportData?.restaurant?.name || (drawerData as any)?.restaurant?.name || "Vinimay Cafe & Restaurant";
  const effectiveCafeAddress = formatRegisterAddress(latestClosedZReport?.restaurant?.address || drawerData?.drawer?.zReportData?.restaurant?.address || drawerData?.restaurant?.address);
  const activeZData: any = isDrawerOpen ? {
    reportNumber: "LIVE DRAFT",
    restaurant: { name: effectiveCafeName, address: effectiveCafeAddress, phone: drawerData?.restaurant?.phone || "", gstin: drawerData?.restaurant?.gstin || "" },
    shift: { name: drawerData?.drawer?.shiftName || "FULL_DAY", openedAt: drawerData?.drawer?.openedAt || new Date().toISOString(), closedAt: new Date().toISOString(), shiftDate: drawerData?.drawer?.shiftDate || new Date().toISOString() },
    cashReconciliation: { openingCash: drawerData?.liveMetrics?.openingCash || 0, cashSales: drawerData?.liveMetrics?.cashSales || 0, cashPayouts: drawerData?.liveMetrics?.cashPayouts || 0, payoutsList: drawerData?.drawer?.payouts || [], expectedCash, actualCashCounted: countedDenominationsTotal, difference: cashDifference, denominations: denominations() },
    salesSummary: null, paymentBreakdown: [], notes: notes || "",
  } : latestClosedZReport || drawerData?.drawer?.zReportData;

  const refresh = async () => { await Promise.all([fetchDrawerData(), fetchZReports()]); };

  const handleOpenDrawer = async () => {
    if (!restaurantId) return;
    const openingCash = parseFloat(openingFloatInput) || 0;
    if (openingCash < 0) return toast({ variant: "destructive", title: "Invalid Float", description: "Opening float cannot be negative" });
    try {
      setIsSubmitting(true);
      await posReportsService.openCashDrawer(restaurantId, { openingCash, shiftName: openingShiftName, notes: `Shift opened by ${user?.contactName || user?.username || "Cashier"} with ₹${openingCash} float` });
      toast({ title: "Register Opened Successfully", description: `Starting cash float of ₹${openingCash.toFixed(2)} recorded.` });
      await refresh();
      setActiveTab("reconciliation");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to open register", description: error.response?.data?.message || error.message });
    } finally { setIsSubmitting(false); }
  };

  const handleAddPayout = async (event: FormEvent) => {
    event.preventDefault();
    if (!restaurantId) return;
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) return toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid payout amount." });
    if (!payoutReason.trim()) return toast({ variant: "destructive", title: "Reason Required", description: "Please enter a description/reason." });
    try {
      setIsSubmitting(true);
      await posReportsService.addCashPayout(restaurantId, { amount, reason: payoutReason.trim() });
      toast({ title: "Cash Payout Logged", description: `₹${amount.toFixed(2)} deducted from drawer for ${payoutReason}.` });
      setPayoutAmount("");
      setPayoutReason("");
      await refresh();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Payout Failed", description: error.response?.data?.message || error.message });
    } finally { setIsSubmitting(false); }
  };

  const handleConfirmClose = async () => {
    if (!restaurantId) return;
    try {
      setIsSubmitting(true);
      const response = await posReportsService.closeCashDrawer(restaurantId, { actualCashCounted: countedDenominationsTotal, denominations: denominations(), notes: notes.trim(), shiftName: drawerData?.drawer?.shiftName || "FULL_DAY" });
      setShowConfirmModal(false);
      toast({ title: "Register Closed & Z-Report Generated", description: `Sequential Z-Report ${response.data?.reportNumber || ""} created.` });
      if (response.data?.zReportData) setLatestClosedZReport(response.data.zReportData);
      await refresh();
      setActiveTab("print");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to close register", description: error.response?.data?.message || error.message });
    } finally { setIsSubmitting(false); }
  };

  return {
    user, restaurantId, activeTab, setActiveTab, isLoading, setIsLoading, isSubmitting, setIsSubmitting, drawerData, isDrawerOpen, latestClosedZReport, setLatestClosedZReport,
    showConfirmModal, setShowConfirmModal, zReportsList, setZReportsList, selectedHistoryReport, setSelectedHistoryReport,
    historyStartDate, setHistoryStartDate, historyEndDate, setHistoryEndDate, openingFloatInput, setOpeningFloatInput,
    openingShiftName, setOpeningShiftName, d500, setD500, d200, setD200, d100, setD100, d50, setD50,
    d20, setD20, d10, setD10, coins, setCoins, notes, setNotes, payoutAmount, setPayoutAmount,
    payoutReason, setPayoutReason, countedDenominationsTotal, expectedCash, cashDifference, effectiveCafeName,
    effectiveCafeAddress, activeZData, fetchDrawerData, fetchZReports, refresh, handleOpenDrawer,
    handleAddPayout, handleConfirmClose,
  };
}
