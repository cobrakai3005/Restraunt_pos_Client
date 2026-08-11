"use client";

import { useState, useEffect } from "react";
import { Plus, Coffee, Trash2, Info, Pencil, Check, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restaurantService } from "@/services/restaurant.service";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EditMenuItemDialog } from "./edit-menu-item-dialog";
import { Pagination } from "@/components/ui/pagination";

const STATIONS = ["BAR", "TANDOOR", "GRILL", "MAIN_KITCHEN", "BAKERY", "COLD_KITCHEN"];
const PAGE_SIZE = 10;

export function MenuItemsTab({ restaurantId }: { restaurantId: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter + Pagination State
  const [statusFilter, setStatusFilter] = useState("all"); // all | true | false
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog State
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Default variant so there is at least one
  const initialVariant = { name: "Regular", price: "", sku: "" };
  
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "",
    categoryId: "", 
    station: "",
    taxPercentage: "0",
    isVeg: "true",
    isAvailable: true,
    isActive: true,
    variants: [{ ...initialVariant }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<any>(null);

  const fetchData = async (currentPage = page, filter = statusFilter) => {
    try {
      setIsLoading(true);
      const [itemsRes, catsRes] = await Promise.all([
        restaurantService.getMenuItems(restaurantId, { page: currentPage, limit: PAGE_SIZE, isActive: filter }),
        restaurantService.getCategories(restaurantId, { isActive: "all" })
      ]);
      if (itemsRes.success) {
        setItems(itemsRes.data.menuItems || []);
        const meta = itemsRes.meta;
        setTotalRecords(meta?.totalRecords ?? itemsRes.data.menuItems?.length ?? 0);
        setTotalPages(meta?.totalPages ?? 1);
      }
      if (catsRes.success) setCategories(catsRes.data.categories || []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchData(1, "all");
  }, [restaurantId]);

  const handleFilterChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
    fetchData(1, v);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchData(p, statusFilter);
  };

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: "", price: "", sku: "" }]
    });
  };

  const handleUpdateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleRemoveVariant = (index: number) => {
    if (formData.variants.length <= 1) return; // Must have at least one variant
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.categoryId || !formData.station) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    // Validate variants
    const validVariants = formData.variants.filter(v => v.name.trim() && v.price !== "");
    if (validVariants.length === 0) {
      toast({ title: "Error", description: "At least one valid variant with a name and price is required", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await restaurantService.createMenuItem(restaurantId, {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        station: formData.station,
        taxPercentage: Number(formData.taxPercentage) || 0,
        isVeg: formData.isVeg === "true" ? true : formData.isVeg === "false" ? false : null,
        isAvailable: formData.isAvailable,
        isActive: formData.isActive,
        variants: validVariants.map(v => ({ name: v.name, price: Number(v.price), sku: v.sku }))
      });
      toast({ title: "Success", description: "Menu item created" });
      setIsAddOpen(false);
      setFormData({ 
        name: "", description: "", categoryId: "", station: "", taxPercentage: "0", 
        isVeg: "true", isAvailable: true, isActive: true, 
        variants: [{ ...initialVariant }]
      });
      fetchData(page, statusFilter);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await restaurantService.deleteMenuItem(restaurantId, id);
      toast({ title: "Success", description: "Menu item deleted" });
      fetchData(page, statusFilter);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading menu items...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-foreground">Menu Items</h3>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="true">Active Only</SelectItem>
              <SelectItem value="false">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
            <tr>
              <th className="py-3 px-4 font-medium">ITEM NAME</th>
              <th className="py-3 px-4 font-medium">CATEGORY</th>
              <th className="py-3 px-4 font-medium">STATION</th>
              <th className="py-3 px-4 font-medium">PRICE</th>
              <th className="py-3 px-4 font-medium">TYPE</th>
              <th className="py-3 px-4 font-medium text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map(item => (
              <tr key={item._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!item.isActive ? 'opacity-60' : ''}`}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100">
                    <Coffee className="w-4 h-4 text-slate-400" />
                    {item.name}
                    {!item.isActive && <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                    {!item.isAvailable && <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">Out of Stock</span>}
                  </div>
                  {item.description && <div className="text-xs text-slate-500 truncate max-w-[200px] mt-1">{item.description}</div>}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{item.categoryId?.name || "Unknown"}</td>
                <td className="py-3 px-4 text-muted-foreground">
                  <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md w-fit">
                    <Tag className="w-3 h-3" /> {item.station}
                  </div>
                </td>
                <td className="py-3 px-4 font-medium text-green-600">
                  {item.variants && item.variants.length > 0 ? (
                    <div>
                      ₹{item.variants[0].price}
                      {item.variants.length > 1 && <span className="text-xs text-slate-400 ml-1">(+{item.variants.length - 1} var)</span>}
                    </div>
                  ) : "N/A"}
                </td>
                <td className="py-3 px-4">
                  {item.isVeg === true && <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-200">Veg</span>}
                  {item.isVeg === false && <span className="text-xs text-rose-700 bg-rose-100 px-2 py-1 rounded-full border border-rose-200">Non-Veg</span>}
                  {item.isVeg === null && <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">N/A</span>}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => { setSelectedMenuItem(item); setIsEditOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={() => handleDelete(item._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-500">No menu items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Item Name <span className="text-rose-500">*</span></Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <Label className="mb-2 block">Category <span className="text-rose-500">*</span></Label>
                <Select value={formData.categoryId} onValueChange={v => setFormData({...formData, categoryId: v})}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Description</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="mb-2 block">KDS Station <span className="text-rose-500">*</span></Label>
                <Select value={formData.station} onValueChange={v => setFormData({...formData, station: v})}>
                  <SelectTrigger><SelectValue placeholder="Station" /></SelectTrigger>
                  <SelectContent>
                    {STATIONS.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Type</Label>
                <Select value={formData.isVeg} onValueChange={v => setFormData({...formData, isVeg: v})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Veg</SelectItem>
                    <SelectItem value="false">Non-Veg</SelectItem>
                    <SelectItem value="null">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Tax %</Label>
                <Input type="number" min="0" max="100" value={formData.taxPercentage} onChange={e => setFormData({...formData, taxPercentage: e.target.value})} />
              </div>
            </div>

            <div className="border border-border rounded-xl p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <Label className="font-semibold text-foreground">Variants (Sizes, Options) <span className="text-rose-500">*</span></Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddVariant} className="h-7 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Add Variant
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.variants.map((variant, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input 
                      placeholder="Variant Name (e.g. Regular)" 
                      value={variant.name} 
                      onChange={e => handleUpdateVariant(index, 'name', e.target.value)} 
                      className="flex-1 bg-card text-card-foreground"
                    />
                    <Input 
                      type="number" 
                      placeholder="Price" 
                      value={variant.price} 
                      onChange={e => handleUpdateVariant(index, 'price', e.target.value)} 
                      className="w-24 bg-card text-card-foreground"
                    />
                    <Input 
                      placeholder="SKU (Opt)" 
                      value={variant.sku} 
                      onChange={e => handleUpdateVariant(index, 'sku', e.target.value)} 
                      className="w-24 bg-card text-card-foreground"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-rose-500" 
                      onClick={() => handleRemoveVariant(index)}
                      disabled={formData.variants.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-6 py-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
              <div className="flex items-center gap-2">
                <Switch checked={formData.isAvailable} onCheckedChange={c => setFormData({...formData, isAvailable: c})} />
                <Label>In Stock</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.isActive} onCheckedChange={c => setFormData({...formData, isActive: c})} />
                <Label>Active (Visible)</Label>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Item"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditMenuItemDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        restaurantId={restaurantId}
        item={selectedMenuItem}
        categories={categories}
        onSuccess={fetchData}
      />
    </div>
  );
}
