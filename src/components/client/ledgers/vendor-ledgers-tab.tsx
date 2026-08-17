"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { format } from "date-fns";
import { Vendor, VendorLedgerData, VendorLedgerEntry } from "./types";

interface VendorLedgersTabProps {
  currentRestaurantId: string;
  vendors: Vendor[];
  selectedVendorId: string;
  setSelectedVendorId: (id: string) => void;
  isVendorsLoading: boolean;
  vendorError: string;
  isVendorLedgerLoading: boolean;
  ledgerData: VendorLedgerData | null;
  vendorSearchQuery: string;
  setVendorSearchQuery: (query: string) => void;
  vendorStartDate: string;
  setVendorStartDate: (date: string) => void;
  vendorEndDate: string;
  setVendorEndDate: (date: string) => void;
  vendorCurrentPage: number;
  setVendorCurrentPage: (page: number | ((p: number) => number)) => void;
  vendorItemsPerPage: number;
  filteredVendorEntries: VendorLedgerEntry[];
  vendorTotalPages: number;
  paginatedVendorEntries: VendorLedgerEntry[];
}

export function VendorLedgersTab({
  currentRestaurantId,
  vendors,
  selectedVendorId,
  setSelectedVendorId,
  isVendorsLoading,
  vendorError,
  isVendorLedgerLoading,
  ledgerData,
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
}: VendorLedgersTabProps) {
  return (
    <div className="space-y-6">
      {/* Vendor Selector Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Select Vendor Account
          </CardTitle>
          <CardDescription>
            Choose a vendor to inspect their running statement of account (Ledger).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Select
              value={selectedVendorId}
              onValueChange={setSelectedVendorId}
              disabled={isVendorsLoading || !currentRestaurantId}
            >
              <SelectTrigger className="w-full md:w-[400px] h-11 font-semibold rounded-xl">
                <SelectValue
                  placeholder={isVendorsLoading ? "Loading vendors..." : "Select a vendor..."}
                />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v._id} value={v._id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {vendorError && <p className="text-sm text-red-500 mt-1">{vendorError}</p>}
          </div>
        </CardContent>
      </Card>

      {isVendorLedgerLoading && (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {ledgerData && !isVendorLedgerLoading && (
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-2 space-y-4 md:space-y-0 border-b">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">Statement of Account</CardTitle>
              <CardDescription>
                Running balance for the selected vendor. Positive balance means you owe them money.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Closing Balance
              </div>
              <div
                className={`text-2xl font-black ${
                  ledgerData.closingBalance > 0 ? "text-red-500" : "text-emerald-500"
                }`}
              >
                ₹{Math.abs(ledgerData.closingBalance).toFixed(2)}
                <span className="text-sm font-normal ml-1">
                  {ledgerData.closingBalance > 0
                    ? "(Cr)"
                    : ledgerData.closingBalance < 0
                    ? "(Dr)"
                    : ""}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-muted/20 rounded-xl">
              <div className="flex flex-1 items-center space-x-2 w-full max-w-md relative">
                <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                <Input
                  placeholder="Search description or type..."
                  value={vendorSearchQuery}
                  onChange={(e) => {
                    setVendorSearchQuery(e.target.value);
                    setVendorCurrentPage(1);
                  }}
                  className="pl-9 w-full bg-background h-10 text-xs rounded-xl"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={vendorStartDate}
                  onChange={(e) => {
                    setVendorStartDate(e.target.value);
                    setVendorCurrentPage(1);
                  }}
                  className="w-full sm:w-auto bg-background text-xs h-10 rounded-xl"
                  title="Start Date"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="date"
                  value={vendorEndDate}
                  onChange={(e) => {
                    setVendorEndDate(e.target.value);
                    setVendorCurrentPage(1);
                  }}
                  className="w-full sm:w-auto bg-background text-xs h-10 rounded-xl"
                  title="End Date"
                />
                <Button
                  variant="ghost"
                  onClick={() => {
                    setVendorSearchQuery("");
                    setVendorStartDate("");
                    setVendorEndDate("");
                    setVendorCurrentPage(1);
                  }}
                  size="sm"
                  className="text-xs font-bold"
                >
                  Reset
                </Button>
              </div>
            </div>

            {filteredVendorEntries.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground border rounded-xl">
                No transactions match your filters.
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/60">
                    <TableRow>
                      <TableHead className="text-[11px] font-extrabold uppercase tracking-wider">Date</TableHead>
                      <TableHead className="text-[11px] font-extrabold uppercase tracking-wider">Type</TableHead>
                      <TableHead className="text-[11px] font-extrabold uppercase tracking-wider">Description</TableHead>
                      <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Debit (₹)</TableHead>
                      <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Credit (₹)</TableHead>
                      <TableHead className="text-[11px] font-extrabold uppercase tracking-wider text-right">Balance (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVendorEntries.map((entry) => (
                      <TableRow key={entry._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40">
                        <TableCell className="text-xs font-medium">
                          {format(new Date(entry.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              entry.type === "PURCHASE"
                                ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            }`}
                          >
                            {entry.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{entry.description || "-"}</TableCell>
                        <TableCell className="text-right text-xs font-bold">
                          {entry.debit > 0 ? entry.debit.toFixed(2) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold">
                          {entry.credit > 0 ? entry.credit.toFixed(2) : "-"}
                        </TableCell>
                        <TableCell className="text-right text-xs font-black">
                          {Math.abs(entry.balance).toFixed(2)}{" "}
                          {entry.balance > 0 ? "Cr" : entry.balance < 0 ? "Dr" : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {vendorTotalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="text-xs text-muted-foreground font-semibold">
                      Showing {(vendorCurrentPage - 1) * vendorItemsPerPage + 1} to{" "}
                      {Math.min(vendorCurrentPage * vendorItemsPerPage, filteredVendorEntries.length)} of{" "}
                      {filteredVendorEntries.length} entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVendorCurrentPage((p) => Math.max(1, (p as number) - 1))}
                        disabled={vendorCurrentPage === 1}
                        className="h-8 text-xs font-bold rounded-lg"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                      </Button>
                      <div className="text-xs font-bold">
                        Page {vendorCurrentPage} of {vendorTotalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVendorCurrentPage((p) => Math.min(vendorTotalPages, (p as number) + 1))}
                        disabled={vendorCurrentPage === vendorTotalPages}
                        className="h-8 text-xs font-bold rounded-lg"
                      >
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
