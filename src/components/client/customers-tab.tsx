"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { customerService, Customer } from "@/services/customer.service";
import { AddCustomerDialog } from "./add-customer-dialog";
import { toast } from "@/components/ui/use-toast";

export function CustomersTab({ restaurantId }: { restaurantId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    if (restaurantId) {
      fetchCustomers();
    }
  }, [restaurantId]);

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getCustomers(restaurantId);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res.data && Array.isArray(res.data)) list = res.data;
      else if (res.data && res.data.customers && Array.isArray(res.data.customers)) list = res.data.customers;
      else if (res.customers && Array.isArray(res.customers)) list = res.customers;

      setCustomers(list);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await customerService.deleteCustomer(id, restaurantId);
      toast({ title: "Deleted", description: "Customer deleted successfully." });
      fetchCustomers();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to delete customer.",
        variant: "destructive" 
      });
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <CardTitle className="text-slate-900 dark:text-white">Customers Directory</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">Manage your regular customers.</CardDescription>
        </div>
        <AddCustomerDialog 
          restaurantId={restaurantId} 
          onSuccess={fetchCustomers} 
        />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Phone</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Email</TableHead>
              <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Address</TableHead>
              <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-32 text-slate-500 dark:text-slate-400">
                  No customers found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer._id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {customer.name}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {customer.phone || "—"}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {customer.email || "—"}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {customer.address || "—"}
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-2">
                    <AddCustomerDialog
                      restaurantId={restaurantId}
                      customerToEdit={customer}
                      onSuccess={fetchCustomers}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      onClick={() => handleDeleteCustomer(customer._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
