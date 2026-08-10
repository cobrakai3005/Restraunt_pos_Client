"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { restaurantService } from "@/services/restaurant.service";
import { useToast } from "@/components/ui/use-toast";

export function EditTableDialog({ open, onOpenChange, restaurantId, table, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ tableNumber: "", capacity: "4", status: "AVAILABLE", isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (table && open) {
      setFormData({
        tableNumber: table.tableNumber || "",
        capacity: table.capacity?.toString() || "4",
        status: table.status || "AVAILABLE",
        isActive: table.isActive !== false,
      });
    }
  }, [table, open]);

  const handleUpdate = async () => {
    if (!formData.tableNumber.trim() || !formData.capacity) return;
    try {
      setIsSubmitting(true);
      await restaurantService.updateTable(restaurantId, table._id, { 
        tableNumber: formData.tableNumber, 
        capacity: Number(formData.capacity) || 1,
        status: formData.status,
        isActive: formData.isActive
      });
      toast({ title: "Success", description: "Table updated" });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Table</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Table Number <span className="text-rose-500">*</span></Label>
              <Input value={formData.tableNumber} onChange={e => setFormData({...formData, tableNumber: e.target.value})} />
            </div>
            <div>
              <Label className="mb-2 block">Capacity <span className="text-rose-500">*</span></Label>
              <Input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Status</Label>
            <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="OCCUPIED">Occupied</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between py-2">
            <Label>Active Status</Label>
            <Switch 
              checked={formData.isActive}
              onCheckedChange={c => setFormData({...formData, isActive: c})}
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting || !formData.tableNumber.trim()}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
