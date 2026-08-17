"use client";

import { useEffect, useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit, Search, Heart, Star, Briefcase, User, Sparkles, Percent } from "lucide-react";
import { customerService, Customer } from "@/services/customer.service";
import { AddCustomerDialog } from "./add-customer-dialog";
import { toast } from "@/components/ui/use-toast";

export function CustomersTab({ restaurantId }: { restaurantId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      fetchCustomers();
    }
  }, [restaurantId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers(restaurantId);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res.data && Array.isArray(res.data)) list = res.data;
      else if (res.data && res.data.customers && Array.isArray(res.data.customers)) list = res.data.customers;
      else if (res.customers && Array.isArray(res.customers)) list = res.customers;

      setCustomers(list);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) return;
    try {
      await customerService.deleteCustomer(id, restaurantId);
      toast({ title: "Deleted ✅", description: "Customer deleted successfully." });
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete customer.",
        variant: "destructive",
      });
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q));

      const matchesTag =
        selectedTag === "ALL" ||
        (selectedTag === "NORMAL" && (!c.tags || c.tags === "NORMAL")) ||
        c.tags === selectedTag;

      return matchesSearch && matchesTag;
    });
  }, [customers, searchQuery, selectedTag]);

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Customer &amp; VIP Directory
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">
            Manage your registered diners, Friend/VIP profiles, and automated discount privileges.
          </CardDescription>
        </div>
        <AddCustomerDialog restaurantId={restaurantId} onSuccess={fetchCustomers} />
      </CardHeader>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-xs"
          />
        </div>

        {/* Tag Filters */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {[
            { id: "ALL", label: "All Diners" },
            { id: "FRIEND", label: "Friends", icon: Heart },
            { id: "VIP", label: "VIPs", icon: Star },
            { id: "STAFF", label: "Staff", icon: Briefcase },
            { id: "NORMAL", label: "Regular", icon: User },
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = selectedTag === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTag(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {Icon && <Icon className="w-3 h-3" />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Customer</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Phone</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Tag / Group</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Discount Rule</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Notes</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-slate-500 dark:text-slate-400">
                  {loading ? "Loading customer profiles..." : "No customers found matching the search criteria."}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => {
                const tag = customer.tags || "NORMAL";
                const hasDiscount =
                  customer.discountType &&
                  customer.discountType !== "NONE" &&
                  (customer.discountValue || 0) > 0;

                return (
                  <TableRow
                    key={customer._id}
                    className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    {/* Name & Email */}
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{customer.name}</div>
                        {customer.email && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{customer.email}</div>
                        )}
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {customer.phone || "—"}
                    </TableCell>

                    {/* Tag Badge */}
                    <TableCell>
                      {tag === "FRIEND" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                          <Heart className="w-3 h-3 text-emerald-600 fill-emerald-600" /> FRIEND
                        </span>
                      )}
                      {tag === "VIP" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 inline-flex items-center gap-1">
                          <Star className="w-3 h-3 text-purple-600 fill-purple-600" /> VIP
                        </span>
                      )}
                      {tag === "STAFF" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-amber-600" /> STAFF
                        </span>
                      )}
                      {tag === "NORMAL" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1">
                          <User className="w-3 h-3" /> REGULAR
                        </span>
                      )}
                    </TableCell>

                    {/* Discount Rule */}
                    <TableCell>
                      {hasDiscount ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <Percent className="w-3 h-3" />
                          {customer.discountType === "PERCENTAGE"
                            ? `${customer.discountValue}% OFF`
                            : `₹${customer.discountValue} OFF`}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">None</span>
                      )}
                    </TableCell>

                    {/* Notes */}
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                      {customer.notes || "—"}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <AddCustomerDialog
                          restaurantId={restaurantId}
                          customerToEdit={customer}
                          onSuccess={fetchCustomers}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                          onClick={() => handleDeleteCustomer(customer._id, customer.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
