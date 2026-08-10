"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { inventoryService } from "@/services/inventory.service";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ChevronsUpDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Restaurant {
  _id: string;
  name: string;
}

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  restaurants: Restaurant[];
  preselectedRestaurantId?: string;
}

export function AddInventoryDialog({ open, onOpenChange, onSuccess, restaurants, preselectedRestaurantId }: AddInventoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "KG" as "KG" | "LITRE" | "GRAM" | "ML" | "PCS",
    currentStock: 0,
    reorderLevel: 0,
    costPerUnit: 0,
  });
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>(
    preselectedRestaurantId ? [preselectedRestaurantId] : []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRestaurants.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select at least one restaurant.",
      });
      return;
    }

    try {
      setLoading(true);
      
      await inventoryService.createInventoryItem({
        ...formData,
        restaurantIds: selectedRestaurants,
        isActive: true,
      });

      toast({
        title: "Success",
        description: "Inventory item created successfully.",
      });
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: "",
        unit: "KG" as "KG" | "LITRE" | "GRAM" | "ML" | "PCS",
        currentStock: 0,
        reorderLevel: 0,
        costPerUnit: 0,
      });
      setSelectedRestaurants(preselectedRestaurantId ? [preselectedRestaurantId] : []);
    } catch (error) {
      console.error("Failed to create inventory item:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRestaurant = (restaurantId: string) => {
    setSelectedRestaurants((prev) => 
      prev.includes(restaurantId) 
        ? prev.filter(id => id !== restaurantId) 
        : [...prev, restaurantId]
    );
  };

  const toggleAll = () => {
    if (selectedRestaurants.length === restaurants.length) {
      setSelectedRestaurants([]);
    } else {
      setSelectedRestaurants(restaurants.map(r => r._id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Item Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Tomatoes, Coffee Beans"
              />
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => setFormData({ ...formData, unit: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KG">Kilogram (KG)</SelectItem>
                  <SelectItem value="LITRE">Litre (L)</SelectItem>
                  <SelectItem value="GRAM">Gram (G)</SelectItem>
                  <SelectItem value="ML">Milliliter (ML)</SelectItem>
                  <SelectItem value="PCS">Pieces (PCS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cost Per Unit (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Initial Stock</Label>
              <Input
                type="number"
                min="0"
                required
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input
                type="number"
                min="0"
                required
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Restaurant Selection for Bulk Creation */}
          <div className="space-y-2 col-span-2 pt-2 border-t mt-2">
            <Label className="text-base font-semibold">Restaurants *</Label>
            
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                onClick={() => setOpenCombobox(!openCombobox)}
                className="w-full justify-between font-normal text-left h-auto min-h-[2.5rem]"
              >
                {selectedRestaurants.length > 0
                  ? `${selectedRestaurants.length} Restaurants Selected`
                  : "Select restaurants..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>

              {openCombobox && (
                <div className="absolute z-[100] mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                  <div className="p-2 border-b flex items-center">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input 
                      placeholder="Search restaurants..." 
                      className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    <div
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm font-medium text-primary outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                      onClick={toggleAll}
                    >
                      {selectedRestaurants.length === restaurants.length ? "Deselect All Restaurants" : "Select All Restaurants"}
                    </div>
                    {restaurants.map((r) => (
                      <div
                        key={r._id}
                        className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        onClick={() => toggleRestaurant(r._id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedRestaurants.includes(r._id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {r.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
