"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Trash2, Edit, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restaurantService } from "@/services/restaurant.service";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EditCategoryDialog } from "./edit-category-dialog";

export function CategoriesTab({ restaurantId }: { restaurantId: string }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog Add State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await restaurantService.getCategories(restaurantId);
      if (res.success) setCategories(res.data.categories || []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchCategories();
  }, [restaurantId]);

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    try {
      setIsSubmitting(true);
      await restaurantService.createCategory(restaurantId, formData);
      toast({ title: "Success", description: "Category created" });
      setFormData({ name: "", description: "", isActive: true });
      setIsAddOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await restaurantService.deleteCategory(restaurantId, id);
      toast({ title: "Success", description: "Category deleted" });
      fetchCategories();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading categories...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Menu Categories</h3>
        <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat._id} className={`flex items-center justify-between p-4 bg-card text-card-foreground border border-border rounded-xl shadow-sm ${!cat.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 flex items-center justify-center rounded-lg ${cat.isActive ? 'bg-orange-50 text-orange-500 dark:bg-orange-900/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {cat.name}
                  {!cat.isActive && <span className="text-[10px] bg-muted text-slate-500 px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                </div>
                {cat.description && <div className="text-xs text-slate-500 truncate max-w-[150px]">{cat.description}</div>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20" onClick={() => { setSelectedCategory(cat); setIsEditOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(cat._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-500 border border-dashed rounded-xl border-border">
            No categories yet. Click "Add Category" to get started.
          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="mb-2 block">Category Name <span className="text-rose-500">*</span></Label>
              <Input 
                placeholder="e.g. Starters" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
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
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={isSubmitting || !formData.name.trim()}>
                {isSubmitting ? "Saving..." : "Save Category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditCategoryDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        restaurantId={restaurantId} 
        category={selectedCategory} 
        onSuccess={fetchCategories} 
      />
    </div>
  );
}
