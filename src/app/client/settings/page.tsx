"use client";

import { useEffect } from "react";
import { Settings, Users, Box, FileText, Store, Trash2, Shield, Bell, Settings2, Receipt, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "lucide-react";
import { vendorService, Vendor } from "@/services/vendor.service";
import { AddVendorDialog } from "@/components/client/add-vendor-dialog";
import { PermissionsTab } from "@/components/client/permissions-tab";
import { InvoicesTab } from "@/components/client/invoices-tab";
import { ProductsTab } from "@/components/client/products-tab";
import { BanksTab } from "@/components/client/banks-tab";
import { CustomersTab } from "@/components/client/customers-tab";
import { toast } from "@/components/ui/use-toast";
import { Landmark, Users2 } from "lucide-react";
import { useClientRestaurants, useClientVendors } from "@/hooks/queries/use-portal-queries";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setClientSelectedRestaurantId } from "@/store/portal-ui-slice";

interface Restaurant {
  _id: string;
  name: string;
}

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const selectedRestaurantId = useAppSelector((state) => state.portalUi.clientSelectedRestaurantId);
  const { data: restaurants = [] } = useClientRestaurants();
  const vendorsQuery = useClientVendors(selectedRestaurantId);
  const vendors = (vendorsQuery.data ?? []) as Vendor[];

  useEffect(() => {
    if (restaurants.length && !restaurants.some((restaurant: Restaurant) => restaurant._id === selectedRestaurantId)) {
      dispatch(setClientSelectedRestaurantId(restaurants[0]._id));
    }
  }, [dispatch, restaurants, selectedRestaurantId]);

  const fetchVendors = async (_restaurantId: string) => {
    await vendorsQuery.refetch();
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await vendorService.deleteVendor(id, selectedRestaurantId);
      toast({ title: "Deleted", description: "Vendor deleted successfully." });
      fetchVendors(selectedRestaurantId);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to delete vendor.",
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            Settings
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your master data, preferences, and business setup.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Select value={selectedRestaurantId} onValueChange={(restaurantId) => dispatch(setClientSelectedRestaurantId(restaurantId))}>
            <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
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
      </div>

      {!selectedRestaurantId ? (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <Settings className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a restaurant to configure settings.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="vendors" className="w-full">
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger 
              value="permissions"
              className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 whitespace-nowrap"
            >
              <Users className="w-4 h-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger 
              value="vendors"
              className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 whitespace-nowrap"
            >
              <Store className="w-4 h-4 mr-2" />
              Vendors
            </TabsTrigger>
            <TabsTrigger 
              value="customers"
              className="data-[state=active]:bg-purple-50 dark:data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400 whitespace-nowrap"
            >
              <Users2 className="w-4 h-4 mr-2" />
              Customers
            </TabsTrigger>
            {/* <TabsTrigger 
              value="invoices"
              className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 whitespace-nowrap"
            >
              <FileText className="w-4 h-4 mr-2" />
              Invoices
            </TabsTrigger> */}
            <TabsTrigger 
              value="products"
              className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 whitespace-nowrap"
            >
              <PackageOpen className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="banks"
              className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 whitespace-nowrap"
            >
              <Landmark className="w-4 h-4 mr-2" />
              Banks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissions">
            <PermissionsTab />
          </TabsContent>

          <TabsContent value="invoices">
            <InvoicesTab />
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <ProductsTab restaurantId={selectedRestaurantId} />
          </TabsContent>

          <TabsContent value="customers" className="mt-6">
            <CustomersTab restaurantId={selectedRestaurantId} />
          </TabsContent>

          <TabsContent value="banks" className="mt-6">
            <BanksTab restaurantId={selectedRestaurantId} />
          </TabsContent>

          <TabsContent value="vendors" className="mt-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white">Vendors Directory</CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">Manage suppliers for your purchases.</CardDescription>
                </div>
                <AddVendorDialog 
                  restaurantId={selectedRestaurantId} 
                  onSuccess={() => fetchVendors(selectedRestaurantId)} 
                />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Contact Person</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Phone</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">GST Number</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-32 text-slate-500 dark:text-slate-400">
                          No vendors found. Add one to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendors.map((vendor) => (
                        <TableRow key={vendor._id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            {vendor.name}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            {vendor.contactPerson || "—"}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            {vendor.phone || "—"}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            {vendor.gstNumber || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteVendor(vendor._id)}
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
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
