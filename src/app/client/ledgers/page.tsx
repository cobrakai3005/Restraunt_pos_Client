"use client";

import { useEffect, useState } from "react";
import { clientService } from "@/services/client.service";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Building2, Users } from "lucide-react";
import {
  CustomerReceivablesTab,
  VendorLedgersTab,
  CollectDuePaymentDialog,
  DuePaymentHistoryDialog,
  useCustomerReceivables,
  useVendorLedgers,
} from "@/components/client/ledgers";

export default function LedgersPage() {
  const { toast } = useToast();

  // Active Tab: "receivables" (Customer Credit) vs "vendors" (Vendor Payables)
  const [activeTab, setActiveTab] = useState<"receivables" | "vendors">("receivables");

  // Restaurant Selector
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string>("");
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(false);

  // Load Restaurants on mount
  useEffect(() => {
    setIsRestaurantsLoading(true);
    clientService
      .getRestaurants()
      .then((res) => {
        const list = res.data?.restaurants || res.restaurants || res.data || res;
        setRestaurants(list);
        if (list.length > 0) setCurrentRestaurantId(list[0]._id);
      })
      .catch((err) => {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Failed to load restaurants",
          description: err.message,
        });
      })
      .finally(() => {
        setIsRestaurantsLoading(false);
      });
  }, [toast]);

  // Customer Receivables State & Handlers
  const receivables = useCustomerReceivables(currentRestaurantId, activeTab);

  // Vendor Ledgers State & Handlers
  const vendorLedgers = useVendorLedgers(currentRestaurantId, activeTab);

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-amber-500" />
            Ledgers & Accounts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage customer credit receivables (Khata) and vendor accounts payable in one place.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Select
            value={currentRestaurantId}
            onValueChange={(val) => {
              setCurrentRestaurantId(val);
              vendorLedgers.setSelectedVendorId("");
              vendorLedgers.setLedgerData(null);
              receivables.setDuePage(1);
            }}
            disabled={isRestaurantsLoading}
          >
            <SelectTrigger className="h-11 font-semibold rounded-xl">
              <SelectValue
                placeholder={isRestaurantsLoading ? "Loading restaurants..." : "Select Restaurant"}
              />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((rest) => (
                <SelectItem key={rest._id} value={rest._id}>
                  {rest.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "receivables" | "vendors")}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full sm:w-[480px] grid-cols-2 p-1 rounded-2xl bg-muted/60 border shadow-xs">
          <TabsTrigger
            value="receivables"
            className="flex items-center gap-2 font-black text-xs sm:text-sm py-2.5 rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 data-[state=active]:shadow-sm"
          >
            <Users className="w-4 h-4" />
            Customer Receivables
          </TabsTrigger>
          <TabsTrigger
            value="vendors"
            className="flex items-center gap-2 font-black text-xs sm:text-sm py-2.5 rounded-xl transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            Vendor Payables
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: CUSTOMER RECEIVABLES ── */}
        <TabsContent value="receivables" className="space-y-6 m-0">
          <CustomerReceivablesTab
            dueOrders={receivables.dueOrders}
            dueCustomers={receivables.dueCustomers}
            dueCustomerId={receivables.dueCustomerId}
            setDueCustomerId={receivables.setDueCustomerId}
            dueSummary={receivables.dueSummary}
            isDueLoading={receivables.isDueLoading}
            isDueExporting={receivables.isDueExporting}
            dueStatusFilter={receivables.dueStatusFilter}
            setDueStatusFilter={receivables.setDueStatusFilter}
            dueFromDate={receivables.dueFromDate}
            setDueFromDate={receivables.setDueFromDate}
            dueToDate={receivables.dueToDate}
            setDueToDate={receivables.setDueToDate}
            duePage={receivables.duePage}
            setDuePage={receivables.setDuePage}
            dueLimit={receivables.dueLimit}
            setDueLimit={receivables.setDueLimit}
            dueTotalItems={receivables.dueTotalItems}
            dueTotalPages={receivables.dueTotalPages}
            onExportCSV={receivables.handleExportDueCSV}
            onOpenCollect={receivables.handleOpenCollect}
            onViewHistory={(ord) => receivables.setSelectedOrderForHistory(ord)}
          />
        </TabsContent>

        {/* ── TAB 2: VENDOR PAYABLES ── */}
        <TabsContent value="vendors" className="space-y-6 m-0">
          <VendorLedgersTab
            currentRestaurantId={currentRestaurantId}
            vendors={vendorLedgers.vendors}
            selectedVendorId={vendorLedgers.selectedVendorId}
            setSelectedVendorId={vendorLedgers.setSelectedVendorId}
            isVendorsLoading={vendorLedgers.isVendorsLoading}
            vendorError={vendorLedgers.vendorError}
            isVendorLedgerLoading={vendorLedgers.isVendorLedgerLoading}
            ledgerData={vendorLedgers.ledgerData}
            vendorSearchQuery={vendorLedgers.vendorSearchQuery}
            setVendorSearchQuery={vendorLedgers.setVendorSearchQuery}
            vendorStartDate={vendorLedgers.vendorStartDate}
            setVendorStartDate={vendorLedgers.setVendorStartDate}
            vendorEndDate={vendorLedgers.vendorEndDate}
            setVendorEndDate={vendorLedgers.setVendorEndDate}
            vendorCurrentPage={vendorLedgers.vendorCurrentPage}
            setVendorCurrentPage={vendorLedgers.setVendorCurrentPage}
            vendorItemsPerPage={vendorLedgers.vendorItemsPerPage}
            filteredVendorEntries={vendorLedgers.filteredVendorEntries}
            vendorTotalPages={vendorTotalPages(vendorLedgers)}
            paginatedVendorEntries={vendorLedgers.paginatedVendorEntries}
          />
        </TabsContent>
      </Tabs>

      {/* ── Payment History Modal ── */}
      <DuePaymentHistoryDialog
        order={receivables.selectedOrderForHistory}
        onClose={() => receivables.setSelectedOrderForHistory(null)}
      />

      {/* ── Collect Due Payment Modal ── */}
      <CollectDuePaymentDialog
        order={receivables.collectOrder}
        onClose={() => receivables.setCollectOrder(null)}
        collectMode={receivables.collectMode}
        setCollectMode={receivables.setCollectMode}
        collectAmount={receivables.collectAmount}
        setCollectAmount={receivables.setCollectAmount}
        collectMethod={receivables.collectMethod}
        setCollectMethod={receivables.setCollectMethod}
        collectSplitCash={receivables.collectSplitCash}
        setCollectSplitCash={receivables.setCollectSplitCash}
        collectSplitUpi={receivables.collectSplitUpi}
        setCollectSplitUpi={receivables.setCollectSplitUpi}
        collectSplitCard={receivables.collectSplitCard}
        setCollectSplitCard={receivables.setCollectSplitCard}
        collectSplitOther={receivables.collectSplitOther}
        setCollectSplitOther={receivables.setCollectSplitOther}
        collectNotes={receivables.collectNotes}
        setCollectNotes={receivables.setCollectNotes}
        isSubmittingPayment={receivables.isSubmittingPayment}
        onSubmit={receivables.handleSubmitDuePayment}
      />
    </div>
  );
}

function vendorTotalPages(v: { filteredVendorEntries: any[]; vendorItemsPerPage: number }) {
  return Math.ceil(v.filteredVendorEntries.length / v.vendorItemsPerPage);
}
