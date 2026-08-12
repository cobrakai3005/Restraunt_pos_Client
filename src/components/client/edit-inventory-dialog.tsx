"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ChevronsUpDown, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const UNITS = [
  { value: "PCS", label: "Piece" },
  { value: "KG", label: "Kg" },
  { value: "LITRE", label: "Litre" },
  { value: "BOX", label: "Box" },
  { value: "METER", label: "Meter" },
  { value: "DOZEN", label: "Dozen" },
  { value: "PACK", label: "Pack" },
  { value: "SQFT", label: "Sq. ft." },
  { value: "GRAM", label: "Gm" },
  { value: "ML", label: "Ml" },
];

interface Restaurant {
  _id: string;
  name: string;
}

interface EditInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  restaurantId: string;
  item: InventoryItem | null;
  restaurants: Restaurant[];
}

export function EditInventoryDialog({ open, onOpenChange, onSuccess, restaurantId, item, restaurants }: EditInventoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [openUnitCombobox, setOpenUnitCombobox] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "KG" as "KG" | "LITRE" | "GRAM" | "ML" | "PCS",
    currentStock: 0,
    reorderLevel: 0,
    costPerUnit: 0,
    restaurantId: restaurantId,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        unit: item.unit,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        costPerUnit: item.costPerUnit,
        restaurantId: restaurantId,
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    try {
      setLoading(true);
      
      // If restaurantId is changed in form, pass it (though backend might ignore it for auth checks)
      const { restaurantId, ...restData } = formData;
      await inventoryService.updateInventoryItem(item._id, {
        ...restData,
      }, formData.restaurantId);

      toast({
        title: "Success",
        description: "Inventory item updated successfully.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update inventory item:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Item Name</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Popover open={openUnitCombobox} onOpenChange={setOpenUnitCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openUnitCombobox}
                    className="w-full justify-between font-normal"
                  >
                    {formData.unit
                      ? UNITS.find((unit) => unit.value === formData.unit)?.label || formData.unit
                      : "Select unit..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search units..." />
                    <CommandList>
                      <CommandEmpty>No unit found.</CommandEmpty>
                      <CommandGroup>
                        {UNITS.map((unit) => (
                          <CommandItem
                            key={unit.value}
                            value={unit.label}
                            onSelect={() => {
                              setFormData({ ...formData, unit: unit.value as any });
                              setOpenUnitCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.unit === unit.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {unit.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Cost Per Unit (₹)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="0"
                value={formData.costPerUnit === 0 || !formData.costPerUnit ? "" : formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Current Stock</Label>
              <Input
                type="number"
                min="0"
                required
                placeholder="0"
                value={formData.currentStock === 0 || !formData.currentStock ? "" : formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Reorder Level</Label>
              <Input
                type="number"
                min="0"
                required
                placeholder="0"
                value={formData.reorderLevel === 0 || !formData.reorderLevel ? "" : formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value === "" ? 0 : parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2 col-span-2 pt-2 border-t mt-2">
              <Label>Restaurant *</Label>
              <Select 
                value={formData.restaurantId} 
                onValueChange={(value) => setFormData({ ...formData, restaurantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              Update Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
