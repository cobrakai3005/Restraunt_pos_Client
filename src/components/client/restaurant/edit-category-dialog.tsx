"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { restaurantService } from "@/services/restaurant.service";
import { useToast } from "@/components/ui/use-toast";

export function EditCategoryDialog({ open, onOpenChange, restaurantId, category, onSuccess }: any) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: "", description: "", isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (category && open) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        isActive: category.isActive !== false,
      });
    }
  }, [category, open]);

  const handleUpdate = async () => {
    if (!formData.name.trim()) return;
    try {
      setIsSubmitting(true);
      await restaurantService.updateCategory(restaurantId, category._id, formData);
      toast({ title: "Success", description: "Category updated" });
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
        <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label className="mb-2 block">Category Name <span className="text-rose-500">*</span></Label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <Label className="mb-2 block">Description</Label>
            <Textarea 
              placeholder="Optional description" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
            />
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
            <Button onClick={handleUpdate} disabled={isSubmitting || !formData.name.trim()}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
