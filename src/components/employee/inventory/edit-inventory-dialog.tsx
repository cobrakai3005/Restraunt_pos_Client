import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { inventoryService, InventoryItem, CreateInventoryItemPayload } from "@/services/inventory.service";
import { Switch } from "@/components/ui/switch";

interface EditInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSuccess: () => void;
}

export function EditInventoryDialog({ open, onOpenChange, item, onSuccess }: EditInventoryDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateInventoryItemPayload>>({});

  useEffect(() => {
    if (item && open) {
      setFormData({
        name: item.name,
        unit: item.unit,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        costPerUnit: item.costPerUnit,
        isActive: item.isActive,
      });
    }
  }, [item, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    try {
      setIsSubmitting(true);
      await inventoryService.updateInventoryItem(item._id, formData);
      toast({ title: "Success", description: "Inventory item updated successfully" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to update inventory item"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Edit Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-slate-700 dark:text-slate-300">Name</Label>
            <Input
              id="edit-name"
              required
              className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Unit</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(val: any) => setFormData({ ...formData, unit: val })}
              >
                <SelectTrigger className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectItem value="KG">KG</SelectItem>
                  <SelectItem value="LITRE">LITRE</SelectItem>
                  <SelectItem value="GRAM">GRAM</SelectItem>
                  <SelectItem value="ML">ML</SelectItem>
                  <SelectItem value="PCS">PCS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-costPerUnit" className="text-slate-700 dark:text-slate-300">Cost per Unit</Label>
              <Input
                id="edit-costPerUnit"
                type="number"
                min="0"
                step="0.01"
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                value={formData.costPerUnit || 0}
                onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-currentStock" className="text-slate-700 dark:text-slate-300">Current Stock</Label>
              <Input
                id="edit-currentStock"
                type="number"
                min="0"
                step="0.01"
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                value={formData.currentStock || 0}
                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-reorderLevel" className="text-slate-700 dark:text-slate-300">Reorder Level</Label>
              <Input
                id="edit-reorderLevel"
                type="number"
                min="0"
                step="0.01"
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                value={formData.reorderLevel || 0}
                onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <Label htmlFor="edit-active" className="text-slate-700 dark:text-slate-300">Active Status</Label>
            <Switch
              id="edit-active"
              checked={formData.isActive || false}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
