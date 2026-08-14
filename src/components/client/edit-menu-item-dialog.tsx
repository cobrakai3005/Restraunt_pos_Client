"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, Loader2 } from "lucide-react";
import { menuService, Category, MenuItem } from "@/services/menu.service";
import { useToast } from "@/components/ui/use-toast";

interface EditMenuItemDialogProps {
  item: MenuItem | null;
  restaurantId: string;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditMenuItemDialog({ item, restaurantId, categories, open, onOpenChange, onSuccess }: EditMenuItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [station, setStation] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [shortCode, setShortCode] = useState("");
  const [numericCode, setNumericCode] = useState("");
  const [variants, setVariants] = useState([{ name: "Regular", price: 0 }]);

  useEffect(() => {
    if (item && open) {
      setName(item.name);
      setDescription(item.description || "");
      setCategoryId(typeof item.categoryId === "string" ? item.categoryId : item.categoryId._id);
      setStation(item.station);
      setTaxPercentage(item.taxPercentage.toString());
      setIsVeg(item.isVeg);
      setIsAvailable(item.isAvailable);
      setShortCode(item.shortCode || "");
      setNumericCode(item.numericCode || "");
      setVariants(item.variants.length > 0 ? [...item.variants] : [{ name: "Regular", price: 0 }]);
    }
  }, [item, open]);

  const addVariant = () => {
    setVariants([...variants, { name: "", price: 0 }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (variants.length === 0 || variants.some((v) => !v.name || v.price <= 0)) {
      toast({ title: "Validation Error", description: "All variants must have a name and a valid price.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await menuService.updateMenuItem(item._id, {
        name,
        description,
        categoryId,
        station,
        taxPercentage: parseFloat(taxPercentage) || 0,
        isVeg,
        isAvailable,
        shortCode: shortCode.trim().toLowerCase() || null,
        numericCode: numericCode.trim() || null,
        variants,
      }, restaurantId);

      toast({ title: "Success", description: "Menu item updated successfully." });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update menu item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
            Edit Menu Item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="space-y-0.5">
              <Label className="text-base">Available for Order</Label>
              <p className="text-sm text-slate-500 dark:text-slate-400">Temporarily mark item out of stock</p>
            </div>
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Item Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kitchen Station *</Label>
              <Select value={station} onValueChange={setStation} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Station" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN_KITCHEN">Main Kitchen</SelectItem>
                  <SelectItem value="TANDOOR">Tandoor</SelectItem>
                  <SelectItem value="GRILL">Grill</SelectItem>
                  <SelectItem value="BAR">Bar</SelectItem>
                  <SelectItem value="BAKERY">Bakery</SelectItem>
                  <SelectItem value="COLD_KITCHEN">Cold Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tax Percentage (%)</Label>
              <Input type="number" step="0.01" min="0" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)} />
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              <Label>Dietary Preference</Label>
              <div className="flex items-center gap-2 mt-2">
                <Switch checked={isVeg} onCheckedChange={setIsVeg} />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {isVeg ? "Veg" : "Non-Veg"}
                </span>
              </div>
            </div>
          </div>

          {/* KOT Shortcodes */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="space-y-1.5">
              <Label className="text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-widest">⚡ Alphabetic Shortcode</Label>
              <Input
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
                placeholder="e.g. bn, pbm, cc"
                maxLength={20}
                className="font-mono"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">Cashier types this to punch fast. Unique per restaurant.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-widest">🔢 Numeric Code</Label>
              <Input
                value={numericCode}
                onChange={(e) => setNumericCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 101, 202"
                maxLength={10}
                className="font-mono"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-400">Optional numeric alternative. Unique per restaurant.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="h-20" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Variants & Pricing *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="w-4 h-4 mr-1" /> Add Variant
              </Button>
            </div>
            <div className="space-y-3">
              {variants.map((variant, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input required placeholder="Variant Name" value={variant.name} onChange={(e) => updateVariant(index, "name", e.target.value)} />
                  </div>
                  <div className="w-32">
                    <Input required type="number" min="1" placeholder="Price" value={variant.price || ""} onChange={(e) => updateVariant(index, "price", parseFloat(e.target.value))} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 shrink-0" onClick={() => removeVariant(index)} disabled={variants.length === 1}>
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
