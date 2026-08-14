"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Package, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { AddInventoryDialog } from "@/components/client/add-inventory-dialog";
import { EditInventoryDialog } from "@/components/client/edit-inventory-dialog";
import { BulkImportDialog } from "@/components/client/bulk-import-dialog";
import { inventoryBulkImportConfig } from "@/lib/bulk-import-configs";

interface ProductsTabProps {
  restaurantId: string;
}

export function ProductsTab({ restaurantId }: ProductsTabProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const itemsRes = await inventoryService.getInventoryItems(restaurantId);
      
      let fetchedItems = [];
      if (Array.isArray(itemsRes)) fetchedItems = itemsRes;
      else if (itemsRes.data && Array.isArray(itemsRes.data.items)) fetchedItems = itemsRes.data.items;
      else if (itemsRes.data && Array.isArray(itemsRes.data)) fetchedItems = itemsRes.data;

      setItems(fetchedItems);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching data",
        description: "Could not load inventory items."
      });
    } finally {
      setLoading(false);
    }
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
      await inventoryService.deleteInventoryItem(item._id, restaurantId);
      toast({ title: "Success", description: "Item deleted successfully" });
      fetchData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item"
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Products & Inventory</h3>
          <p className="text-sm text-slate-500">Manage your inventory items for this restaurant.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)} className="gap-2">
            <UploadCloud className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 border rounded-lg border-dashed">
          <Package className="h-10 w-10 mb-2 opacity-20" />
          <p>No inventory items found.</p>
          <Button variant="link" onClick={() => setIsAddDialogOpen(true)} className="mt-2">
            Create your first product
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
              {items.map((item) => (
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
                    <Badge variant={item.isActive ? "default" : "secondary"} className={item.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                      {item.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item)}>
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

      {/* Reusing dialogs from the inventory module */}
      <AddInventoryDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onSuccess={fetchData}
        restaurants={[{ _id: restaurantId, name: "Current Restaurant" } as any]}
        preselectedRestaurantId={restaurantId}
      />
      
      <EditInventoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={fetchData}
        restaurantId={restaurantId}
        item={editingItem}
        restaurants={[{ _id: restaurantId, name: "Current Restaurant" } as any]}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        restaurantId={restaurantId}
        config={inventoryBulkImportConfig}
        onSuccess={fetchData}
      />
    </div>
  );
}
