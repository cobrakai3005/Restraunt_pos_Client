"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { employeeService } from "@/services/employee.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  CreditCard,
  CheckCircle2,
  Clock,
  Check,
  User,
  Phone,
  History,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Printer,
  Receipt,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { connectSocket } from "@/lib/socket";
import { customerService, Customer } from "@/services/customer.service";
import { CustomerSearchSelect } from "@/components/ui/customer-search-select";
import type { Order } from "./cashier-dashboard";

interface CashierReceivablesPanelProps {
  onCollectPayment: (order: Order) => void;
  onViewHistory: (order: Order) => void;
  onBulkSettle?: (customer: Customer, orders?: Order[]) => void;
  onViewReceipt?: (order: Order) => void;
}

export function CashierReceivablesPanel({
  onCollectPayment,
  onViewHistory,
  onBulkSettle,
  onViewReceipt,
}: CashierReceivablesPanelProps) {
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("ALL");
  const [summary, setSummary] = useState({
    totalOutstandingDue: 0,
    totalCollectedDue: 0,
    activeDueCount: 0,
    settledDueCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const limit = 15;
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch customers list for filter dropdown & balance sync
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await customerService.getCustomers(undefined, { isActive: true });
      const list = res?.data?.customers || res?.data || res?.customers || [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load customer list for credit filter", err);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Map of customerId -> outstanding due orders in current view
  const customerDueOrdersMap = useMemo(() => {
    const map = new Map<string, Order[]>();
    orders.forEach((o) => {
      const cId =
        typeof o.customerDetails?.customerId === "object"
          ? (o.customerDetails?.customerId as any)?._id
          : o.customerDetails?.customerId;
      const due = Number(o.financials?.dueAmount || 0);
      if (cId && due > 0) {
        const existing = map.get(String(cId)) || [];
        existing.push(o);
        map.set(String(cId), existing);
      }
    });
    return map;
  }, [orders]);

  const fetchDueOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit,
      };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (selectedCustomerId && selectedCustomerId !== "ALL") params.customerId = selectedCustomerId;

      // Note: apiClient in employeeService sends auth JWT token with cashier's restaurantId automatically
      const res = await (await import("@/lib/api")).apiClient.get("/orders/dues", { params });

      if (res.data?.success) {
        const orderList = res.data.data || [];
        const totalCount = res.data.meta?.totalRecords ?? res.data.meta?.total ?? orderList.length;
        const pageCount = res.data.meta?.totalPages ?? res.data.meta?.pages ?? 1;

        setOrders(orderList);
        setTotalItems(totalCount);
        setTotalPages(pageCount);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error fetching credit accounts",
        description: err.response?.data?.message || err.message,
      });
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, statusFilter, selectedCustomerId, toast]);

  useEffect(() => {
    fetchDueOrders();

    const handleUpdate = () => {
      fetchDueOrders();
      fetchCustomers();
    };

    const socket = connectSocket();
    if (socket) {
      socket.on("order_due_updated", handleUpdate);
    }
    return () => {
      if (socket) {
        socket.off("order_due_updated", handleUpdate);
      }
    };
  }, [fetchDueOrders, fetchCustomers]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-6 pb-16 space-y-5">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/40 dark:from-amber-950/20 dark:to-slate-900 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Outstanding Credit
              </p>
              <h3 className="text-xl font-black text-amber-900 dark:text-amber-200 mt-0.5">
                ₹{summary.totalOutstandingDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-muted-foreground">Unpaid customer balances</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/40 dark:from-emerald-950/20 dark:to-slate-900 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Collected Credit
              </p>
              <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                ₹{summary.totalCollectedDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-muted-foreground">Recovered dues</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pending Accounts
              </p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {summary.activeDueCount} Orders
              </h3>
              <p className="text-[10px] text-muted-foreground">Awaiting payment</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Settled Orders
              </p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                {summary.settledDueCount} Orders
              </h3>
              <p className="text-[10px] text-muted-foreground">Fully cleared</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Check className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Searchable Customer Combobox */}
            <div className="flex-1 w-full">
              <CustomerSearchSelect
                customers={customers}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={(cId) => {
                  setSelectedCustomerId(cId);
                  setPage(1);
                }}
                placeholder="Search or select customer (Name / Mobile) to view credit..."
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-10 text-xs font-bold rounded-xl bg-white dark:bg-slate-950">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending (Full Credit)</SelectItem>
                  <SelectItem value="PARTIAL">Partial Credit</SelectItem>
                  <SelectItem value="PAID">Settled (Paid)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  fetchDueOrders();
                  fetchCustomers();
                }}
                className="h-10 w-10 rounded-xl shrink-0"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Active Customer Filter Banner */}
          {selectedCustomerId !== "ALL" && (() => {
            const selectedCustomerObj = customers.find(c => c._id === selectedCustomerId);
            const custTotalDue = (() => {
              const ordersSum = orders
                .filter(
                  (o) =>
                    o.financials?.dueStatus === "PENDING" ||
                    o.financials?.dueStatus === "PARTIAL" ||
                    Number(o.financials?.dueAmount || 0) > 0
                )
                .reduce((sum, o) => sum + Number(o.financials?.dueAmount || 0), 0);

              // If orders have finished loading or returned records, ordersSum is the live accurate truth
              if (!isLoading || orders.length > 0) {
                return ordersSum;
              }

              // Fallback during initial loading only
              if (Number(selectedCustomerObj?.outstandingDue || 0) > 0) {
                return Number(selectedCustomerObj?.outstandingDue);
              }
              if (Number(selectedCustomerObj?.closingBalance || 0) > 0) {
                return Number(selectedCustomerObj?.closingBalance);
              }
              return ordersSum;
            })();

            const isFullySettled = custTotalDue === 0;

            return (
              <div
                className={`flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border text-xs shadow-2xs transition-colors ${
                  isFullySettled
                    ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <User
                    className={`w-4 h-4 shrink-0 ${
                      isFullySettled
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span>
                      Viewing credit receivables for:{" "}
                      <strong>{selectedCustomerObj?.name || "Selected Customer"}</strong>{" "}
                      {selectedCustomerObj?.phone ? `(${selectedCustomerObj.phone})` : ""}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-extrabold text-xs border ${
                        isFullySettled
                          ? "bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-950 dark:text-emerald-100 border-emerald-400 dark:border-emerald-700"
                          : "bg-amber-200/80 dark:bg-amber-900/70 text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-700"
                      }`}
                    >
                      Total Due:{" "}
                      <strong
                        className={`text-sm font-black ${
                          isFullySettled
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        ₹{custTotalDue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        {isFullySettled && " (All Settled! ✓)"}
                      </strong>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {onBulkSettle && selectedCustomerObj && custTotalDue > 0 && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const customerDueOrders = orders.filter(
                          (o) =>
                            (o.financials?.dueStatus === "PENDING" ||
                              o.financials?.dueStatus === "PARTIAL" ||
                              Number(o.financials?.dueAmount || 0) > 0) &&
                            ((typeof o.customerDetails?.customerId === "object"
                              ? (o.customerDetails?.customerId as any)?._id
                              : o.customerDetails?.customerId) === selectedCustomerId)
                        );
                        onBulkSettle(selectedCustomerObj, customerDueOrders);
                      }}
                      className="h-8 px-3 text-xs font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg shadow-xs flex items-center gap-1.5 active:scale-95"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Settle in One Go (₹{custTotalDue.toLocaleString("en-IN")})
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomerId("ALL");
                      setPage(1);
                    }}
                    className="h-7 px-2.5 text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg shrink-0"
                  >
                    ✕ Clear Customer Filter
                  </Button>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/80 dark:bg-slate-900/80 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">Date & Time</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">Order / Table</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">Customer</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-right">Bill Total</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-right">Paid</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-right">Outstanding Due</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-right">Collect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8} className="h-14 text-center">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse mx-auto w-3/4" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-36 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <CreditCard className="w-8 h-8 opacity-30 text-slate-400" />
                        <p className="font-bold text-sm">No credit receivables match your filter</p>
                        <p className="text-xs">Search with another customer name or mobile number.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((o) => {
                    const dueAmt = Number(o.financials?.dueAmount || 0);
                    const paidAmt = Number(o.financials?.paidAmount || 0);
                    const grandTotal = Number(o.financials?.grandTotal || 0);
                    const dueStatus = o.financials?.dueStatus || "NONE";
                    const paymentCount = o.financials?.duePayments?.length || 0;

                    return (
                      <TableRow key={o._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {o.createdAt ? (
                            <>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {new Date(o.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Billed: {new Date(o.createdAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                              {o.financials?.duePayments && o.financials.duePayments.length > 0 && (
                                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  Paid: {new Date(o.financials.duePayments[o.financials.duePayments.length - 1].receivedAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })} {new Date(o.financials.duePayments[o.financials.duePayments.length - 1].receivedAt).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          #ORD-{o._id.slice(-4).toUpperCase()}
                          <div className="text-[10px] text-muted-foreground font-sans">
                            {o.tableId?.tableNumber ? `Table ${o.tableId.tableNumber}` : o.orderType}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {o.customerDetails?.name || "Walk-in Guest"}
                              </div>
                              {o.customerDetails?.phone && (
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" /> {o.customerDetails.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right text-xs font-bold text-slate-900 dark:text-white">
                          ₹{grandTotal.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{paidAmt.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-right text-xs font-black text-amber-600 dark:text-amber-400">
                          ₹{dueAmt.toFixed(2)}
                        </TableCell>

                        <TableCell className="text-center">
                          {dueStatus === "PAID" && (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 text-[10px] font-black uppercase">
                              Settled ✓
                            </Badge>
                          )}
                          {dueStatus === "PARTIAL" && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 text-[10px] font-black uppercase">
                              Partial Credit
                            </Badge>
                          )}
                          {dueStatus === "PENDING" && (
                            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 text-[10px] font-black uppercase">
                              Pending Credit
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {onViewReceipt && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onViewReceipt(o)}
                                className="h-8 text-xs font-bold px-2.5 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="View & Print 80mm Receipt Slip"
                              >
                                <Printer className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                Receipt
                              </Button>
                            )}

                            {paymentCount > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onViewHistory(o)}
                                className="h-8 text-xs font-bold px-2 rounded-lg text-slate-600 dark:text-slate-300"
                                title="View payment logs"
                              >
                                <History className="w-3.5 h-3.5 mr-1" /> {paymentCount}
                              </Button>
                            )}

                            {dueAmt > 0 && (
                              <Button
                                size="sm"
                                onClick={() => onCollectPayment(o)}
                                className="h-8 text-xs font-extrabold px-3.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-xs"
                              >
                                💰 Collect
                              </Button>
                            )}

                            {(() => {
                              const cId =
                                typeof o.customerDetails?.customerId === "object"
                                  ? (o.customerDetails?.customerId as any)?._id
                                  : o.customerDetails?.customerId;
                              const custDueList = cId ? customerDueOrdersMap.get(String(cId)) || [] : [];
                              const custObj = cId ? customers.find((c) => c._id === String(cId)) : null;

                              if (onBulkSettle && custObj && custDueList.length > 1 && dueAmt > 0) {
                                return (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onBulkSettle(custObj, custDueList)}
                                    className="h-8 text-xs font-extrabold px-2.5 rounded-lg border-amber-400/80 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 shadow-2xs"
                                    title={`Settle all ${custDueList.length} credit orders for ${custObj.name}`}
                                  >
                                    ⚡ Settle All ({custDueList.length})
                                  </Button>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-3.5 border-t bg-slate-50/60 dark:bg-slate-900/40">
            <div className="text-xs text-muted-foreground font-semibold">
              {totalItems === 0
                ? "Showing 0 of 0 accounts"
                : `Showing ${(page - 1) * limit + 1} - ${Math.min(page * limit, totalItems)} of ${totalItems} accounts`}
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-bold px-2">
                Page {page} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
