"use client";

import { useEffect, useState } from "react";
import { Plus, Package, Edit, Trash2, Search, UploadCloud, Download, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { clientService } from "@/services/client.service";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { AddInventoryDialog } from "@/components/client/add-inventory-dialog";
import { EditInventoryDialog } from "@/components/client/edit-inventory-dialog";
import { BulkImportDialog } from "@/components/client/bulk-import-dialog";
import { inventoryBulkImportConfig } from "@/lib/bulk-import-configs";
import { toast } from "@/components/ui/use-toast";

interface Restaurant {
  _id: string;
  name: string;
}

const PAGE_SIZE = 10;

export default function ClientInventoryPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Search + Pagination State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      setPage(1);
      fetchInventory(selectedRestaurantId, 1, "");
    } else {
      setInventoryItems([]);
    }
  }, [selectedRestaurantId]);

  const fetchRestaurants = async () => {
    try {
      const res = await clientService.getRestaurants();
      
      // Handle different possible backend response structures
      let restaurantList = [];
      if (Array.isArray(res)) {
        restaurantList = res;
      } else if (res.data && Array.isArray(res.data)) {
        restaurantList = res.data;
      } else if (res.data && res.data.restaurants && Array.isArray(res.data.restaurants)) {
        restaurantList = res.data.restaurants;
      } else if (res.restaurants && Array.isArray(res.restaurants)) {
        restaurantList = res.restaurants;
      }
      
      if (restaurantList.length > 0) {
        setRestaurants(restaurantList);
        setSelectedRestaurantId(restaurantList[0]._id);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch restaurants.",
      });
    }
  };

  const fetchInventory = async (restaurantId: string, currentPage = page, searchTerm = search) => {
    try {
      const res = await inventoryService.getInventoryItems(restaurantId, {
        page: currentPage,
        limit: PAGE_SIZE,
        search: searchTerm || undefined,
      });
      setInventoryItems(res.data || []);
      const meta = res.meta;
      setTotalRecords(meta?.totalRecords ?? res.data?.length ?? 0);
      setTotalPages(meta?.totalPages ?? 1);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchInventory(selectedRestaurantId, 1, value);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchInventory(selectedRestaurantId, p, search);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      return;
    }

    try {
      await inventoryService.deleteInventoryItem(item._id, selectedRestaurantId);
      toast({ title: "Success", description: "Item deleted successfully" });
      fetchInventory(selectedRestaurantId, page, search);
    } catch (error) {
      console.error("Failed to delete item", error);
    }
  };

  const handleExportLowStock = async () => {
    if (!selectedRestaurantId) {
      toast({
        title: "No restaurant selected",
        description: "Please select a restaurant branch first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);
      // Fetch all inventory items (without pagination limit) for this restaurant
      const res = await inventoryService.getInventoryItems(selectedRestaurantId);
      const allItems: InventoryItem[] = Array.isArray(res) ? res : res.data || [];

      // Filter items where currentStock <= reorderLevel
      const lowStockItems = allItems.filter(
        (item) => Number(item.currentStock ?? 0) <= Number(item.reorderLevel ?? 0)
      );

      if (lowStockItems.length === 0) {
        toast({
          title: "All stocks are healthy",
          description: "No items found where current stock is equal to or below the reorder level.",
        });
        return;
      }

      // Generate CSV Content
      const headers = [
        "Item Name",
        "Current Stock",
        "Unit",
        "Reorder Level",
        "Shortage / Deficit",
        "Cost Per Unit (INR)",
        "Estimated Reorder Cost (INR)",
        "Stock Status",
      ];

      const rows = lowStockItems.map((item) => {
        const currentStock = Number(item.currentStock || 0);
        const reorderLevel = Number(item.reorderLevel || 0);
        const shortage = Math.max(0, reorderLevel - currentStock);
        const costPerUnit = Number(item.costPerUnit || 0);
        const estimatedCost = shortage * costPerUnit;
        const status = currentStock <= 0 ? "OUT OF STOCK" : "LOW STOCK";

        return [
          `"${(item.name || "").replace(/"/g, '""')}"`,
          currentStock,
          item.unit || "PCS",
          reorderLevel,
          shortage,
          costPerUnit.toFixed(2),
          estimatedCost.toFixed(2),
          status,
        ];
      });

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const restaurantName = restaurants.find((r) => r._id === selectedRestaurantId)?.name || "Restaurant";
      const sanitizedName = restaurantName.replace(/[^a-zA-Z0-9_-]/g, "_");
      const dateStr = format(new Date(), "yyyy-MM-dd");

      link.setAttribute("href", url);
      link.setAttribute("download", `Low_Stock_Report_${sanitizedName}_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${lowStockItems.length} low stock item${lowStockItems.length === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      console.error("Failed to export low stock items:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export low stock items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage ingredients and products across all your restaurants.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select 
            value={selectedRestaurantId} 
            onValueChange={setSelectedRestaurantId}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a restaurant" />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map(r => (
                <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={handleExportLowStock} 
            className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:text-amber-400 dark:hover:bg-amber-500/10" 
            disabled={!selectedRestaurantId || isExporting}
          >
            <Download className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export Low Stock"}
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="gap-2" disabled={!selectedRestaurantId}>
            <UploadCloud className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Product
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            {selectedRestaurantId 
              ? `Currently viewing items for ${restaurants.find(r => r._id === selectedRestaurantId)?.name}` 
              : "Select a restaurant to view its inventory"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedRestaurantId ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-20" />
              <p>Please select a restaurant to view inventory</p>
            </div>
          ) : inventoryItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-20" />
              <p>No inventory items found for this restaurant.</p>
              <Button 
                variant="link" 
                onClick={() => setIsAddDialogOpen(true)}
                className="mt-2"
              >
                Add your first item
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <span className={item.currentStock <= item.reorderLevel ? "text-red-500 font-bold" : ""}>
                          {item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>₹{item.costPerUnit}</TableCell>
                      <TableCell>{item.reorderLevel}</TableCell>
                      <TableCell>
                        <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-green-100 text-green-800" : ""}>
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {inventoryItems.length > 0 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={totalPages}
                totalRecords={totalRecords}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <AddInventoryDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onSuccess={() => {
          if (selectedRestaurantId) fetchInventory(selectedRestaurantId, page, search);
        }}
        restaurants={restaurants}
        preselectedRestaurantId={selectedRestaurantId}
      />
      
      <EditInventoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          if (selectedRestaurantId) fetchInventory(selectedRestaurantId, page, search);
        }}
        restaurantId={selectedRestaurantId}
        item={editingItem}
        restaurants={restaurants}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        restaurantId={selectedRestaurantId}
        config={inventoryBulkImportConfig}
        onSuccess={() => {
          if (selectedRestaurantId) fetchInventory(selectedRestaurantId, page, search);
        }}
      />
    </div>
  );
}
