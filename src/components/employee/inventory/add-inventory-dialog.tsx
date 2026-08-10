import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { inventoryService, CreateInventoryItemPayload } from "@/services/inventory.service";

interface AddInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddInventoryDialog({ open, onOpenChange, onSuccess }: AddInventoryDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateInventoryItemPayload>({
    name: "",
    unit: "KG",
    currentStock: 0,
    reorderLevel: 0,
    costPerUnit: 0,
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await inventoryService.createInventoryItem(formData);
      toast({ title: "Success", description: "Inventory item added successfully" });
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        unit: "KG",
        currentStock: 0,
        reorderLevel: 0,
        costPerUnit: 0,
        isActive: true,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.message || "Failed to add inventory item"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-900 dark:text-white">Add Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">Name</Label>
            <Input
              id="name"
              required
              className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              value={formData.name}
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
                  <SelectItem value="KG" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">KG</SelectItem>
                  <SelectItem value="LITRE" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">LITRE</SelectItem>
                  <SelectItem value="GRAM" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">GRAM</SelectItem>
                  <SelectItem value="ML" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">ML</SelectItem>
                  <SelectItem value="PCS" className="text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">PCS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="costPerUnit" className="text-slate-700 dark:text-slate-300">Cost per Unit</Label>
              <Input
                id="costPerUnit"
                type="number"
                min="0"
                step="0.01"
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                value={formData.costPerUnit}
                onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock" className="text-slate-700 dark:text-slate-300">Initial Stock</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                step="0.01"
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reorderLevel" className="text-slate-700 dark:text-slate-300">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                step="0.01"
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
              />
            </div>
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
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
