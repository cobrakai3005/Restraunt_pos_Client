"use client";

import { useEffect, useState, useMemo } from "react";
import { clientService } from "@/services/client.service";
import { vendorService, Vendor } from "@/services/vendor.service";
import { transactionService } from "@/services/transaction.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function LedgersPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string>("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [ledgerData, setLedgerData] = useState<{ closingBalance: number; entries: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(true);
  const [isVendorsLoading, setIsVendorsLoading] = useState(false);
  const [error, setError] = useState("");
  const [vendorError, setVendorError] = useState("");

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsRestaurantsLoading(true);
    clientService.getRestaurants().then(res => {
      const list = res.data?.restaurants || res.restaurants || res.data || res;
      setRestaurants(list);
      if (list.length > 0) setCurrentRestaurantId(list[0]._id);
    }).catch(err => {
      console.error(err);
      setError("Failed to load restaurants");
    }).finally(() => {
      setIsRestaurantsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (currentRestaurantId) {
      loadVendors();
    }
  }, [currentRestaurantId]);

  useEffect(() => {
    if (selectedVendorId && currentRestaurantId) {
      loadLedger(selectedVendorId);
    } else {
      setLedgerData(null);
    }
  }, [selectedVendorId, currentRestaurantId]);

  const loadVendors = async () => {
    try {
      setIsVendorsLoading(true);
      setVendorError("");
      const res = await vendorService.getVendors(currentRestaurantId);
      setVendors(res.data.vendors);
    } catch (err: any) {
      console.error(err);
      setVendorError("Failed to load vendors");
    } finally {
      setIsVendorsLoading(false);
    }
  };

  const loadLedger = async (vendorId: string) => {
    setLoading(true);
    setError("");
    setCurrentPage(1); // Reset page on new load
    try {
      const res = await transactionService.getLedger(vendorId, undefined, currentRestaurantId);
      setLedgerData(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!ledgerData) return [];
    return ledgerData.entries.filter((entry) => {
      let matchesSearch = true;
      let matchesDate = true;

      if (searchQuery) {
        matchesSearch = (entry.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (entry.type || "").toLowerCase().includes(searchQuery.toLowerCase());
      }

      const entryDate = new Date(entry.date);
      if (startDate) {
        if (isBefore(entryDate, new Date(startDate))) matchesDate = false;
      }
      if (endDate) {
        // End date should include the end of the day
        const endD = new Date(endDate);
        endD.setHours(23, 59, 59, 999);
        if (isAfter(entryDate, endD)) matchesDate = false;
      }

      return matchesSearch && matchesDate;
    });
  }, [ledgerData, searchQuery, startDate, endDate]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Vendor Ledgers</h1>
        
        <div className="w-full sm:w-72">
          <Select 
            value={currentRestaurantId} 
            onValueChange={(val) => { setCurrentRestaurantId(val); setSelectedVendorId(""); setLedgerData(null); }}
            disabled={isRestaurantsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={isRestaurantsLoading ? "Loading restaurants..." : "Select Restaurant"} />
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

      <Card>
        <CardHeader>
          <CardTitle>Select Vendor</CardTitle>
          <CardDescription>Choose a vendor to view their statement of account (Ledger).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId} disabled={isVendorsLoading || !currentRestaurantId}>
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder={isVendorsLoading ? "Loading vendors..." : "Select a vendor..."} />
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

      {error && <div className="text-red-500 font-medium">{error}</div>}

      {loading && (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {ledgerData && !loading && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-2 space-y-4 md:space-y-0">
            <div className="space-y-1">
              <CardTitle>Statement of Account</CardTitle>
              <CardDescription>
                Running balance for the selected vendor. Positive balance means you owe them money.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Closing Balance</div>
              <div className={`text-2xl font-bold ${ledgerData.closingBalance > 0 ? "text-red-500" : "text-green-500"}`}>
                ₹{Math.abs(ledgerData.closingBalance).toFixed(2)}
                <span className="text-sm font-normal ml-1">
                  {ledgerData.closingBalance > 0 ? "(Cr)" : ledgerData.closingBalance < 0 ? "(Dr)" : ""}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 bg-muted/20 rounded-lg">
              <div className="flex flex-1 items-center space-x-2 w-full max-w-md relative">
                <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
                <Input
                  placeholder="Search description or type..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-9 w-full bg-background"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-auto bg-background text-sm"
                  title="Start Date"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="w-full sm:w-auto bg-background text-sm"
                  title="End Date"
                />
                <Button variant="ghost" onClick={resetFilters} size="sm">Reset</Button>
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground border rounded-lg">No transactions match your filters.</div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit (₹)</TableHead>
                      <TableHead className="text-right">Credit (₹)</TableHead>
                      <TableHead className="text-right">Balance (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEntries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell>{format(new Date(entry.date), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entry.type === 'PURCHASE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {entry.type}
                          </span>
                        </TableCell>
                        <TableCell>{entry.description || "-"}</TableCell>
                        <TableCell className="text-right">{entry.debit > 0 ? entry.debit.toFixed(2) : "-"}</TableCell>
                        <TableCell className="text-right">{entry.credit > 0 ? entry.credit.toFixed(2) : "-"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {Math.abs(entry.balance).toFixed(2)} {entry.balance > 0 ? "Cr" : entry.balance < 0 ? "Dr" : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEntries.length)} of {filteredEntries.length} entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                      </Button>
                      <div className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
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
