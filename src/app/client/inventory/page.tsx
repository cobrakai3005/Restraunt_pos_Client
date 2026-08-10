"use client";

import { useEffect, useState } from "react";
import { Plus, Package, Edit, Trash2, ArrowUpDown } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { clientService } from "@/services/client.service";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { AddInventoryDialog } from "@/components/client/add-inventory-dialog";
import { EditInventoryDialog } from "@/components/client/edit-inventory-dialog";
import { toast } from "@/components/ui/use-toast";

interface Restaurant {
  _id: string;
  name: string;
}

export default function ClientInventoryPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchInventory(selectedRestaurantId);
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

  const fetchInventory = async (restaurantId: string) => {
    try {
      const res = await inventoryService.getInventoryItems(restaurantId);
      setInventoryItems(res.data || []);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
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
      await inventoryService.deleteInventoryItem(item._id, selectedRestaurantId);
      toast({ title: "Success", description: "Item deleted successfully" });
      fetchInventory(selectedRestaurantId);
    } catch (error) {
      console.error("Failed to delete item", error);
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
        </CardContent>
      </Card>

      <AddInventoryDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onSuccess={() => {
          if (selectedRestaurantId) fetchInventory(selectedRestaurantId);
        }}
        restaurants={restaurants}
        preselectedRestaurantId={selectedRestaurantId}
      />
      
      <EditInventoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          if (selectedRestaurantId) fetchInventory(selectedRestaurantId);
        }}
        restaurantId={selectedRestaurantId}
        item={editingItem}
        restaurants={restaurants}
      />
    </div>
  );
}
