"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  History,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Order } from "./types";

interface CustomerReceivablesTableProps {
  dueOrders: Order[];
  isDueLoading: boolean;
  duePage: number;
  setDuePage: (page: number | ((p: number) => number)) => void;
  dueLimit: number;
  setDueLimit: (limit: number) => void;
  dueTotalItems: number;
  dueTotalPages: number;
  onOpenCollect: (order: Order) => void;
  onViewHistory: (order: Order) => void;
}

export function CustomerReceivablesTable({
  dueOrders,
  isDueLoading,
  duePage,
  setDuePage,
  dueLimit,
  setDueLimit,
  dueTotalItems,
  dueTotalPages,
  onOpenCollect,
  onViewHistory,
}: CustomerReceivablesTableProps) {
  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
              <TableRow>
                <TableHead className="text-[11px] font-extrabold uppercase tracking-wider">Date & Time</TableHead>
                <TableHead className="text-[11px] font-extrabold uppercase tracking-wider">Invoice / Order</TableHead>
                <TableHead className="text-[11px] font-extrabold uppercase tracking-wider">Customer Details</TableHead>
                <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Grand Total</TableHead>
                <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Paid</TableHead>
                <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Outstanding</TableHead>
                <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isDueLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8} className="h-14 text-center">
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse mx-auto w-3/4" />
                    </TableCell>
                  </TableRow>
                ))
              ) : dueOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <CreditCard className="w-8 h-8 opacity-40 text-slate-400" />
                      <p className="font-semibold text-sm">No credit receivables found</p>
                      <p className="text-xs">Adjust your search filters or date range.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                dueOrders.map((o) => {
                  const dueAmt = Number(o.financials?.dueAmount || 0);
                  const paidAmt = Number(o.financials?.paidAmount || 0);
                  const grandTotal = Number(o.financials?.grandTotal || 0);
                  const dueStatus = o.financials?.dueStatus || "NONE";
                  const paymentCount = o.financials?.duePayments?.length || 0;

                  return (
                    <TableRow key={o._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                      <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(o.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </TableCell>

                      <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        #ORD-{o._id.slice(-4).toUpperCase()}
                        <div className="text-[10px] text-muted-foreground font-sans">
                          {o.orderType}
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
                        {dueStatus === "NONE" && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-slate-400">
                            Standard
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {paymentCount > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewHistory(o)}
                              className="h-8 text-xs font-bold px-2.5 rounded-lg text-slate-600 dark:text-slate-300"
                              title="View payment logs"
                            >
                              <History className="w-3.5 h-3.5 mr-1" /> {paymentCount}
                            </Button>
                          )}

                          {dueAmt > 0 && (
                            <Button
                              size="sm"
                              onClick={() => onOpenCollect(o)}
                              className="h-8 text-xs font-extrabold px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-xs"
                            >
                              Collect
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/60 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <span>Rows:</span>
            <Select
              value={String(dueLimit)}
              onValueChange={(val) => {
                setDueLimit(Number(val));
                setDuePage(1);
              }}
            >
              <SelectTrigger className="w-[70px] h-8 text-xs font-bold rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span>
              {dueTotalItems === 0
                ? "0 of 0"
                : `${(duePage - 1) * dueLimit + 1} - ${Math.min(duePage * dueLimit, dueTotalItems)} of ${dueTotalItems}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={duePage <= 1 || isDueLoading}
              onClick={() => setDuePage((p) => Math.max(1, (p as number) - 1))}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-xs font-bold px-2">
              Page {duePage} of {dueTotalPages || 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={duePage >= dueTotalPages || isDueLoading}
              onClick={() => setDuePage((p) => Math.min(dueTotalPages, (p as number) + 1))}
              className="h-8 w-8 p-0 rounded-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
