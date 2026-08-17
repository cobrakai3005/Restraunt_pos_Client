"use client";

import { useState, useEffect, useMemo } from "react";
import { vendorService, Vendor } from "@/services/vendor.service";
import { transactionService } from "@/services/transaction.service";
import { useToast } from "@/components/ui/use-toast";
import { isAfter, isBefore } from "date-fns";
import { VendorLedgerData } from "./types";

export function useVendorLedgers(
  currentRestaurantId: string,
  activeTab: "receivables" | "vendors"
) {
  const { toast } = useToast();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [ledgerData, setLedgerData] = useState<VendorLedgerData | null>(null);
  const [isVendorLedgerLoading, setIsVendorLedgerLoading] = useState(false);
  const [isVendorsLoading, setIsVendorsLoading] = useState(false);
  const [vendorError, setVendorError] = useState("");

  // Vendor Filters & Pagination
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [vendorStartDate, setVendorStartDate] = useState("");
  const [vendorEndDate, setVendorEndDate] = useState("");
  const [vendorCurrentPage, setVendorCurrentPage] = useState(1);
  const vendorItemsPerPage = 10;

  // Load Vendors when Restaurant changes
  useEffect(() => {
    if (currentRestaurantId && activeTab === "vendors") {
      loadVendors();
    }
  }, [currentRestaurantId, activeTab]);

  const loadVendors = async () => {
    if (!currentRestaurantId) return;
    setIsVendorsLoading(true);
    setVendorError("");
    try {
      const res = await vendorService.getVendors(currentRestaurantId);
      const list = res.data?.vendors || res.data || [];
      setVendors(list);
      if (list.length > 0 && !selectedVendorId) {
        setSelectedVendorId(list[0]._id);
      }
    } catch (err: any) {
      console.error(err);
      setVendorError("Failed to load vendors");
    } finally {
      setIsVendorsLoading(false);
    }
  };

  // Load Vendor Statement
  useEffect(() => {
    if (selectedVendorId && currentRestaurantId && activeTab === "vendors") {
      loadLedger(selectedVendorId);
    } else {
      setLedgerData(null);
    }
  }, [selectedVendorId, currentRestaurantId, activeTab]);

  const loadLedger = async (vendorId: string) => {
    setIsVendorLedgerLoading(true);
    setVendorCurrentPage(1);
    try {
      const res = await transactionService.getLedger(vendorId, undefined, currentRestaurantId);
      setLedgerData(res.data);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Failed to load vendor ledger",
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsVendorLedgerLoading(false);
    }
  };

  const filteredVendorEntries = useMemo(() => {
    if (!ledgerData) return [];
    return ledgerData.entries.filter((entry) => {
      let matchesSearch = true;
      let matchesDate = true;

      if (vendorSearchQuery) {
        matchesSearch =
          (entry.description || "").toLowerCase().includes(vendorSearchQuery.toLowerCase()) ||
          (entry.type || "").toLowerCase().includes(vendorSearchQuery.toLowerCase());
      }

      const entryDate = new Date(entry.date);
      if (vendorStartDate) {
        if (isBefore(entryDate, new Date(vendorStartDate))) matchesDate = false;
      }
      if (vendorEndDate) {
        const endD = new Date(vendorEndDate);
        endD.setHours(23, 59, 59, 999);
        if (isAfter(entryDate, endD)) matchesDate = false;
      }

      return matchesSearch && matchesDate;
    });
  }, [ledgerData, vendorSearchQuery, vendorStartDate, vendorEndDate]);

  const vendorTotalPages = Math.ceil(filteredVendorEntries.length / vendorItemsPerPage);
  const paginatedVendorEntries = filteredVendorEntries.slice(
    (vendorCurrentPage - 1) * vendorItemsPerPage,
    vendorCurrentPage * vendorItemsPerPage
  );

  return {
    vendors,
    selectedVendorId,
    setSelectedVendorId,
    ledgerData,
    setLedgerData,
    isVendorLedgerLoading,
    isVendorsLoading,
    vendorError,
    vendorSearchQuery,
    setVendorSearchQuery,
    vendorStartDate,
    setVendorStartDate,
    vendorEndDate,
    setVendorEndDate,
    vendorCurrentPage,
    setVendorCurrentPage,
    vendorItemsPerPage,
    filteredVendorEntries,
    vendorTotalPages,
    paginatedVendorEntries,
    loadVendors,
    loadLedger,
  };
}
