"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, Loader2 } from "lucide-react";
import { menuService, Category } from "@/services/menu.service";
import { useToast } from "@/components/ui/use-toast";

interface AddMenuItemDialogProps {
  restaurantId: string;
  categories: Category[];
  onSuccess: () => void;
}

export function AddMenuItemDialog({ restaurantId, categories, onSuccess }: AddMenuItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [station, setStation] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [isVeg, setIsVeg] = useState(true);
  const [variants, setVariants] = useState([{ name: "Regular", price: 0 }]);

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
    if (variants.length === 0 || variants.some((v) => !v.name || v.price <= 0)) {
      toast({ title: "Validation Error", description: "All variants must have a name and a valid price.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await menuService.createMenuItem({
        name,
        description,
        categoryId,
        station,
        taxPercentage: parseFloat(taxPercentage) || 0,
        isVeg,
        variants,
      }, restaurantId);

      toast({ title: "Success", description: "Menu item created successfully." });
      onSuccess();
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create menu item",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setCategoryId("");
    setStation("");
    setTaxPercentage("0");
    setIsVeg(true);
    setVariants([{ name: "Regular", price: 0 }]);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Menu Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">
            Add New Menu Item
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          
          {/* Basic Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Item Name *</Label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Margherita Pizza" />
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

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the dish" className="h-20" />
          </div>

          {/* Variants */}
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
                    <Input required placeholder="Variant Name (e.g. Regular)" value={variant.name} onChange={(e) => updateVariant(index, "name", e.target.value)} />
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Save Menu Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
