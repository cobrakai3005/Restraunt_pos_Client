"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { restaurantService } from "@/services/restaurant.service";
import { useToast } from "@/components/ui/use-toast";
import { MenuImageField } from "./menu-image-field";

const STATIONS = ["BAR", "TANDOOR", "GRILL", "MAIN_KITCHEN", "BAKERY", "COLD_KITCHEN"];

export function EditMenuItemDialog({ open, onOpenChange, restaurantId, item, categories, onSuccess }: any) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({ 
    name: "", 
    description: "",
    categoryId: "", 
    station: "",
    taxPercentage: "0",
    isVeg: "true",
    isAvailable: true,
    isActive: true,
    shortCode: "",
    numericCode: "",
    variants: [{ name: "Regular", price: "", sku: "" }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    if (item && open) {
      setFormData({
        name: item.name || "",
        description: item.description || "",
        categoryId: item.categoryId?._id || item.categoryId || "",
        station: item.station || "",
        taxPercentage: item.taxPercentage?.toString() || "0",
        isVeg: item.isVeg === true ? "true" : item.isVeg === false ? "false" : "null",
        isAvailable: item.isAvailable !== false,
        isActive: item.isActive !== false,
        shortCode: item.shortCode || "",
        numericCode: item.numericCode || "",
        variants: item.variants && item.variants.length > 0 
          ? item.variants.map((v: any) => ({ name: v.name, price: v.price?.toString(), sku: v.sku || "" }))
          : [{ name: "Regular", price: item.price?.toString() || "", sku: "" }]
      });
      setImageFile(null);
      setRemoveImage(false);
    }
  }, [item, open]);

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
    if (formData.variants.length <= 1) return;
    const newVariants = [...formData.variants];
    newVariants.splice(index, 1);
    setFormData({ ...formData, variants: newVariants });
  };

  const handleUpdate = async () => {
    if (!formData.name.trim() || !formData.categoryId || !formData.station) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const validVariants = formData.variants.filter(v => v.name.trim() && v.price !== "");
    if (validVariants.length === 0) {
      toast({ title: "Error", description: "At least one valid variant with a name and price is required", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await restaurantService.updateMenuItem(restaurantId, item._id, {
        name: formData.name,
        description: formData.description,
        categoryId: formData.categoryId,
        station: formData.station,
        taxPercentage: Number(formData.taxPercentage) || 0,
        isVeg: formData.isVeg === "true" ? true : formData.isVeg === "false" ? false : null,
        isAvailable: formData.isAvailable,
        isActive: formData.isActive,
        shortCode: formData.shortCode.trim().toLowerCase() || null,
        numericCode: formData.numericCode.trim() || null,
        variants: validVariants.map(v => ({ name: v.name, price: Number(v.price), sku: v.sku }))
      });

      if (removeImage) {
        await restaurantService.removeMenuItemImage(restaurantId, item._id);
      } else if (imageFile) {
        await restaurantService.uploadMenuItemImage(restaurantId, item._id, imageFile);
      }

      toast({ title: "Success", description: "Menu item updated" });
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">

          <MenuImageField
            currentImage={item?.imageUrl}
            onFileChange={setImageFile}
            onRemoveChange={setRemoveImage}
          />

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
                  {categories.map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
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
              <Label className="text-foreground">Tax (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.taxPercentage}
                onChange={e => setFormData({...formData, taxPercentage: e.target.value})}
                onFocus={e => e.target.select()}
              />
            </div>
          </div>

          {/* KOT Shortcodes */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="space-y-1.5">
              <Label className="text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-widest">⚡ Alphabetic Shortcode</Label>
              <Input
                value={formData.shortCode}
                onChange={e => setFormData({...formData, shortCode: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "")})}
                placeholder="e.g. bn, pbm, cc"
                maxLength={20}
                className="font-mono"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">Cashier types this to punch fast. Unique per restaurant.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-widest">🔢 Numeric Code</Label>
              <Input
                value={formData.numericCode}
                onChange={e => setFormData({...formData, numericCode: e.target.value.replace(/[^0-9]/g, "")})}
                placeholder="e.g. 101, 202"
                maxLength={10}
                className="font-mono"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">Optional numeric alternative. Unique per restaurant.</p>
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
                    onFocus={e => e.target.select()}
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
