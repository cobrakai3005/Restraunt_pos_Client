"use client";

import { useEffect, useState } from "react";
import { Plus, FileText, Calendar as CalendarIcon, Search, ChevronDown, MoreVertical } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientService } from "@/services/client.service";
import { transactionService, Transaction } from "@/services/transaction.service";
import { CreateTransactionModal } from "@/components/client/create-transaction-modal";
import { InvoicePreviewModal } from "@/components/client/invoice-preview-modal";
import { toast } from "@/components/ui/use-toast";

interface Restaurant {
  _id: string;
  name: string;
  settings?: {
    vendorInvoiceTemplate?: string;
    customerInvoiceTemplate?: string;
  };
}

type TabType = "All" | "Sales" | "Purchases" | "Payments" | "Journals";
const TABS: TabType[] = ["All", "Sales", "Purchases", "Payments", "Journals"];

export default function TransactionsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [newTransactionType, setNewTransactionType] = useState<"PURCHASE" | "PAYMENT" | "JOURNAL">("PURCHASE");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryRevenue, setSummaryRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [printInvoiceOpen, setPrintInvoiceOpen] = useState(false);
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [invoiceAutoAction, setInvoiceAutoAction] = useState<'print' | 'download' | 'whatsapp' | 'email' | null>(null);

  const getCompanyName = (transaction: Transaction) => {
    const company = typeof transaction.companyId === "object" ? transaction.companyId : null;
    return company?.name || transaction.companyName || transaction.customerName || "-";
  };
  

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setTotalPages(1);
      setTotalRecords(0);
      setSummaryRevenue(0);
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurantId, activeTab, searchQuery, selectedDate, page]);

  // Debounce search input -> server filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim().toLowerCase());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchRestaurants = async () => {
    try {
      const res = await clientService.getRestaurants();
      let restaurantList = [];
      if (Array.isArray(res)) restaurantList = res;
      else if (res.data && Array.isArray(res.data)) restaurantList = res.data;
      else if (res.data && res.data.restaurants && Array.isArray(res.data.restaurants)) restaurantList = res.data.restaurants;
      else if (res.restaurants && Array.isArray(res.restaurants)) restaurantList = res.restaurants;

      setRestaurants(restaurantList);
      if (restaurantList.length > 0) {
        setSelectedRestaurantId(restaurantList[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    }
  };

  const openTransactionModal = (type: "PURCHASE" | "PAYMENT" | "JOURNAL") => {
    setTransactionToEdit(null);
    setNewTransactionType(type);
    setIsModalOpen(true);
  };

  const fetchTransactions = async (targetPage = page) => {
    try {
      setIsLoading(true);
      const type = activeTab === "All"
        ? undefined
        : activeTab === "Sales"
          ? "SALES"
          : activeTab === "Purchases"
            ? "PURCHASE"
            : activeTab === "Payments"
              ? "PAYMENT"
              : "JOURNAL";

      const query: any = { page: targetPage, limit: 10 };
      if (type) query.type = type;
      if (searchQuery) query.search = searchQuery;
      if (selectedDate) {
        query.from = format(selectedDate, "yyyy-MM-dd");
        query.to = format(selectedDate, "yyyy-MM-dd");
      }

      const res = await transactionService.getTransactions(query, selectedRestaurantId);
      const payload = res.data;
      const txList = Array.isArray(payload) ? payload : (payload as any).data || [];
      setTransactions(txList);
      const meta = (payload as any)?.meta;
      if (meta) {
        setTotalPages(meta.totalPages);
        setTotalRecords(meta.totalRecords);
      }
      const summary = (payload as any)?.summary;
      if (summary && typeof summary.revenue === "number") {
        setSummaryRevenue(summary.revenue);
      } else {
        const calculated = txList
          .filter((t: any) => t.type === "SALES" || t.type === "RECEIPT")
          .reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0);
        setSummaryRevenue(calculated);
      }
      setPage(targetPage);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await transactionService.deleteTransaction(id, selectedRestaurantId);
      toast({ title: "Success", description: "Transaction deleted successfully." });
      fetchTransactions();
    } catch (error: any) {
      toast({ title: "Error", description: error.response?.data?.message || "Failed to delete transaction.", variant: "destructive" });
    }
  };

  const dailyRevenue = summaryRevenue;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Transactions</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          {restaurants.length > 0 && (
            <div className="w-48 mr-4">
              <Select value={selectedRestaurantId} onValueChange={(value) => { setSelectedRestaurantId(value); setPage(1); }}>
                <SelectTrigger className="bg-white dark:bg-slate-900 rounded-full border-gray-200 dark:border-slate-800">
                  <SelectValue placeholder="Select Restaurant" />
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
          )}

          <Button variant="outline" className="rounded-full border-blue-200 px-5 text-blue-600 hover:bg-blue-50" onClick={() => openTransactionModal("PURCHASE")}>
            <Plus className="mr-2 h-4 w-4" /> Add Purchase
          </Button>
          <Button variant="outline" className="rounded-full border-green-200 px-5 text-green-600 hover:bg-green-50" onClick={() => openTransactionModal("PAYMENT")}>
            <Plus className="mr-2 h-4 w-4" /> Add Payment
          </Button>
          <Button variant="outline" className="rounded-full border-purple-200 dark:border-purple-500/30 px-5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10" onClick={() => openTransactionModal("JOURNAL")}>
            <Plus className="mr-2 h-4 w-4" /> Add Journal
          </Button>

          {/* Transaction creation is intentionally disabled. Sales invoices come from orders. */}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2 overflow-x-auto">
        <div className="flex space-x-1 bg-white dark:bg-slate-900 rounded-full p-1 border border-gray-100 dark:border-slate-800 shadow-sm min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                activeTab === tab
                  ? "bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-full text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-800 min-w-max ml-4">
              <CalendarIcon className="w-4 h-4 mr-2 text-purple-500" />
              {selectedDate ? format(selectedDate, "dd MMM yyyy") : "Pick a date"}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => { setSelectedDate(date); setPage(1); }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Revenue Summary Banner */}
      <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-full flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Revenue for {selectedDate ? format(selectedDate, "dd MMM yyyy") : "All Time"}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{dailyRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Filter by party, product, or description..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-950/50 border-gray-200 dark:border-slate-800 rounded-lg"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-gray-100 dark:border-slate-800">
              <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Details</TableHead>
              <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Company</TableHead>
              <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Items / Services</TableHead>
              <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Payment Method</TableHead>
              <TableHead className="text-gray-500 dark:text-gray-400 font-medium text-right">Amount ↑↓</TableHead>
              <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Date</TableHead>
              <TableHead className="text-gray-500 dark:text-gray-400 font-medium">Type</TableHead>
              <TableHead className="text-gray-500 dark:text-gray-400 font-medium w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <TableRow key={index} className="border-gray-100 dark:border-slate-800">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-2.5 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-3 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-3 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={8} className="text-center h-32 text-gray-500 dark:text-gray-400">
                   No transactions found.
                 </TableCell>
               </TableRow>
            ) : (
              transactions.map((tx) => {
                const company = typeof tx.companyId === 'object' ? tx.companyId : null;
                const companyName = company?.name || tx.companyName || tx.customerName || '—';
                const detailsName = tx.customerName || companyName || (tx.type === 'JOURNAL' ? 'Journal Entry' : '—');
                const initials = detailsName !== '—' ? detailsName.substring(0, 2).toUpperCase() : '??';
                
                // Show description if it's not the default invoice text
                const showDesc = tx.description && !tx.description.startsWith('1. This invoice is valid');
                
                // Determine payment method colors based on mock data
                let pmClass = "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300";
                if (tx.paymentMethod?.toLowerCase().includes("cash") || tx.status === 'PAID') {
                  pmClass = "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
                } else if (tx.paymentMethod?.toLowerCase().includes("credit") || tx.status === 'UNPAID') {
                  pmClass = "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
                }

                return (
                  <TableRow
                    key={tx._id}
                    className="border-gray-100 dark:border-slate-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 text-xs font-medium">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">{detailsName}</span>
                          {/* {showDesc && <span className="text-xs text-gray-500 truncate max-w-[200px]">{tx.description}</span>} */}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        {companyName !== '—' && <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                        <div>
                          <p>{companyName}</p>
                          {company?.phone && <p className="text-xs text-gray-400 dark:text-gray-500">{company.phone}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {tx.items && tx.items.length > 0 ? (
                        tx.items.length === 1 ? tx.items[0].name : `${tx.items[0].name} +${tx.items.length - 1}`
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${pmClass}`}>
                        {tx.paymentMethod || (tx.type === 'JOURNAL' ? "Not applicable" : tx.type === 'PURCHASE' ? "Not recorded" : tx.status === 'UNPAID' ? "Pending payment" : "—")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium text-gray-900 dark:text-white">
                      ₹{tx.totalAmount?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {format(new Date(tx.transactionDate || new Date()), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 capitalize">
                        {tx.type?.toLowerCase() || 'unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => event.stopPropagation()}
                        >
                          {(tx.type === "PURCHASE" || tx.type === "JOURNAL") && (
                            <DropdownMenuItem onClick={() => {
                              setTransactionToEdit(tx);
                              setNewTransactionType("PURCHASE");
                              setIsModalOpen(true);
                            }}>
                              Edit Purchase
                            </DropdownMenuItem>
                          )}

                        

                         
                          <DropdownMenuItem onClick={() => {
                            setSelectedInvoiceToPrint(tx);
                            setInvoiceAutoAction(null);
                            setPrintInvoiceOpen(true);
                          }}>
                            View Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedInvoiceToPrint(tx);
                            setInvoiceAutoAction('print');
                            setPrintInvoiceOpen(true);
                          }}>
                            Print Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedInvoiceToPrint(tx);
                            setInvoiceAutoAction('download');
                            setPrintInvoiceOpen(true);
                          }}>
                            Download PDF
                          </DropdownMenuItem>

                          
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => handleDeleteTransaction(tx._id)}
                          >
                            Delete Transaction
                          </DropdownMenuItem>
                          {/* Proforma conversion and deletion are intentionally disabled. */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {transactions.length} of {totalRecords} transaction{totalRecords === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-gray-200 dark:border-slate-800"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-gray-200 dark:border-slate-800"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <CreateTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchTransactions();
        }}
        restaurantId={selectedRestaurantId}
        defaultTab={newTransactionType}
        initialData={transactionToEdit}
        allowedTypes={["PURCHASE", "PAYMENT", "JOURNAL"]}
      />

      <InvoicePreviewModal 
        isOpen={printInvoiceOpen} 
        onClose={() => {
          setPrintInvoiceOpen(false);
          setInvoiceAutoAction(null);
        }} 
        transaction={selectedInvoiceToPrint} 
        restaurantDetails={restaurants.find(r => r._id === selectedRestaurantId)}
        autoAction={invoiceAutoAction}
      />

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.type === "PURCHASE"
                ? "Purchase item details"
                : selectedTransaction?.type === "PAYMENT"
                  ? "Payment voucher details"
                  : selectedTransaction?.type === "JOURNAL"
                    ? "Journal entry details"
                  : "Sales invoice details"}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction?.type === "SALES" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 dark:bg-slate-950/50 p-4 md:grid-cols-4">
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Customer</p><p className="font-semibold">{selectedTransaction.customerName || selectedTransaction.companyName || "Walk-in Customer"}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Status</p><p className="font-semibold">{selectedTransaction.status}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p><p className="font-semibold">{selectedTransaction.paymentMethod || "Pending payment"}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Date</p><p className="font-semibold">{format(new Date(selectedTransaction.transactionDate), "dd MMM yyyy")}</p></div>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-5 bg-gray-100 dark:bg-slate-800 p-3 text-sm font-semibold"><span className="col-span-2">Item</span><span>Qty</span><span>Price/Unit</span><span className="text-right">Total</span></div>
                {(selectedTransaction.items || []).map((item, index) => (
                  <div key={index} className="grid grid-cols-5 border-t p-3 text-sm"><span className="col-span-2">{item.name || "Menu item"}</span><span>{item.quantity || 0} {item.unit || ""}</span><span>Rs. {(item.pricePerUnit || 0).toFixed(2)}</span><span className="text-right">Rs. {(item.amount || 0).toFixed(2)}</span></div>
                ))}
              </div>
              <div className="flex justify-end gap-8 text-sm font-semibold"><span>Subtotal: Rs. {(selectedTransaction.subtotal || 0).toFixed(2)}</span><span>Tax: Rs. {(selectedTransaction.taxAmount || 0).toFixed(2)}</span><span>Total: Rs. {(selectedTransaction.totalAmount || 0).toFixed(2)}</span><span>Paid: Rs. {(selectedTransaction.paidAmount || 0).toFixed(2)}</span></div>
            </div>
          ) : selectedTransaction?.type === "PURCHASE" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 dark:bg-slate-950/50 p-4 md:grid-cols-4">
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Vendor</p><p className="font-semibold">{getCompanyName(selectedTransaction)}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Invoice Number</p><p className="font-semibold">{selectedTransaction.referenceNumber || "-"}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p><p className="font-semibold">{selectedTransaction.paymentMethod || "-"}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Status</p><p className="font-semibold">{selectedTransaction.status}</p></div>
              </div>
              <div className="overflow-hidden rounded-lg border">
                <div className="grid grid-cols-5 bg-gray-100 dark:bg-slate-800 p-3 text-sm font-semibold"><span className="col-span-2">Item</span><span>Qty</span><span>Price/Unit</span><span className="text-right">Total</span></div>
                {(selectedTransaction.items || []).map((item, index) => (
                  <div key={index} className="grid grid-cols-5 border-t p-3 text-sm"><span className="col-span-2">{item.name || "Inventory item"}</span><span>{item.quantity || 0} {item.unit || ""}</span><span>Rs. {(item.pricePerUnit || 0).toFixed(2)}</span><span className="text-right">Rs. {(item.amount || 0).toFixed(2)}</span></div>
                ))}
              </div>
              <div className="flex justify-end gap-8 text-sm font-semibold"><span>Subtotal: Rs. {(selectedTransaction.subtotal || 0).toFixed(2)}</span><span>Total: Rs. {(selectedTransaction.totalAmount || 0).toFixed(2)}</span><span>Paid: Rs. {(selectedTransaction.paidAmount || 0).toFixed(2)}</span></div>
            </div>
          ) : selectedTransaction?.type === "JOURNAL" ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 dark:bg-slate-950/50 p-4 md:grid-cols-4">
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Entry Type</p><p className="font-semibold">Journal Entry</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Amount</p><p className="font-semibold text-purple-600 dark:text-purple-400">Rs. {(selectedTransaction.totalAmount || 0).toFixed(2)}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Status</p><p className="font-semibold">{selectedTransaction.status}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Date</p><p className="font-semibold">{format(new Date(selectedTransaction.transactionDate), "dd MMM yyyy")}</p></div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Company</p><p className="font-semibold">{getCompanyName(selectedTransaction)}</p></div>
                <div className="rounded-lg border p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Transaction Date</p><p className="font-semibold">{format(new Date(selectedTransaction.transactionDate), "dd MMM yyyy")}</p></div>
                <div className="rounded-lg border p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Debit Account</p><p className="font-semibold">{(selectedTransaction as any).debitAccount || "-"}</p></div>
                <div className="rounded-lg border p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Credit Account</p><p className="font-semibold">{(selectedTransaction as any).creditAccount || "-"}</p></div>
              </div>
              <div className="rounded-lg border p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Narration</p><p>{selectedTransaction.description || "-"}</p></div>
            </div>
          ) : selectedTransaction && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-gray-50 dark:bg-slate-950/50 p-4 md:grid-cols-4">
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Voucher Type</p><p className="font-semibold">Payment Voucher</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Amount</p><p className="font-semibold text-green-600 dark:text-green-400">Rs. {(selectedTransaction.totalAmount || 0).toFixed(2)}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Payment Method</p><p className="font-semibold">{selectedTransaction.paymentMethod || "-"}</p></div>
                <div><p className="text-xs text-gray-500 dark:text-gray-400">Date</p><p className="font-semibold">{format(new Date(selectedTransaction.transactionDate), "dd MMM yyyy")}</p></div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="rounded-lg border p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Party</p><p className="font-semibold">{getCompanyName(selectedTransaction)}</p></div><div className="rounded-lg border p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Company</p><p className="font-semibold">{getCompanyName(selectedTransaction)}</p></div><div className="rounded-lg border p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Reference Number</p><p className="font-semibold">{selectedTransaction.referenceNumber || "-"}</p></div></div>
              <div className="rounded-lg border p-4"><p className="text-xs text-gray-500 dark:text-gray-400">Description</p><p>{selectedTransaction.description || "-"}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
