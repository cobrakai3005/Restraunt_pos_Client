"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Minus, Loader2, Sparkles, Trash2, Upload, Image as ImageIcon, X } from "lucide-react";
import { menuService, Category, MenuItem, ModifierGroup } from "@/services/menu.service";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [station, setStation] = useState("");
  const [taxPercentage, setTaxPercentage] = useState("0");
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [shortCode, setShortCode] = useState("");
  const [numericCode, setNumericCode] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImageOnSave, setRemoveImageOnSave] = useState(false);
  const [variants, setVariants] = useState<any[]>([{ name: "Regular", price: "" }]);
  const [modifierGroups, setModifierGroups] = useState<any[]>([]);

  useEffect(() => {
    if (item && open) {
      setName(item.name);
      setDescription(item.description || "");
      setCategoryId(typeof item.categoryId === "string" ? item.categoryId : item.categoryId._id);
      setStation(item.station);
      setTaxPercentage((item.taxPercentage ?? 5).toString());
      setIsVeg(item.isVeg);
      setIsAvailable(item.isAvailable);
      setShortCode(item.shortCode || "");
      setNumericCode(item.numericCode || "");
      setImageUrl(item.imageUrl || "");
      setImageFile(null);
      setImagePreview(item.imageUrl || null);
      setRemoveImageOnSave(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setVariants(
        item.variants && item.variants.length > 0
          ? item.variants.map((v) => ({ name: v.name, price: v.price }))
          : [{ name: "Regular", price: "" }]
      );
      setModifierGroups(
        item.modifierGroups && item.modifierGroups.length > 0
          ? item.modifierGroups.map((g) => ({
              ...g,
              options: g.options.map((o) => ({ ...o, price: o.price })),
            }))
          : []
      );
    }
  }, [item, open]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast({
        title: "Invalid Format",
        description: "Please upload a JPEG, PNG, WebP or GIF image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image size must be 5MB or less.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImageOnSave(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl("");
    setRemoveImageOnSave(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", price: "" }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  // Modifier Groups Management
  const addModifierGroup = () => {
    setModifierGroups([
      ...modifierGroups,
      {
        name: "",
        minSelection: 0,
        maxSelection: 1, // Single choice by default
        options: [{ name: "", price: "", isDefault: false }],
      },
    ]);
  };

  const removeModifierGroup = (groupIndex: number) => {
    setModifierGroups(modifierGroups.filter((_, i) => i !== groupIndex));
  };

  const updateModifierGroup = (groupIndex: number, field: string, value: any) => {
    const next = [...modifierGroups];
    next[groupIndex] = { ...next[groupIndex], [field]: value };
    setModifierGroups(next);
  };

  const addModifierOption = (groupIndex: number) => {
    const next = [...modifierGroups];
    next[groupIndex].options.push({ name: "", price: "", isDefault: false });
    setModifierGroups(next);
  };

  const removeModifierOption = (groupIndex: number, optionIndex: number) => {
    const next = [...modifierGroups];
    next[groupIndex].options = next[groupIndex].options.filter((_: any, i: number) => i !== optionIndex);
    setModifierGroups(next);
  };

  const updateModifierOption = (groupIndex: number, optionIndex: number, field: string, value: any) => {
    const next = [...modifierGroups];
    next[groupIndex].options[optionIndex] = {
      ...next[groupIndex].options[optionIndex],
      [field]: value,
    };
    setModifierGroups(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    const cleanVariants = variants.map((v) => ({
      name: (v.name || "").trim(),
      price: parseFloat(v.price) || 0,
    }));

    if (cleanVariants.length === 0 || cleanVariants.some((v) => !v.name || v.price < 0)) {
      toast({ title: "Validation Error", description: "All variants must have a name and a valid price.", variant: "destructive" });
      return;
    }

    // Clean valid modifier groups
    const cleanModifierGroups = modifierGroups
      .filter((g) => g.name.trim().length > 0)
      .map((g) => ({
        name: g.name.trim(),
        minSelection: Number(g.minSelection) || 0,
        maxSelection: Number(g.maxSelection) || 1,
        options: g.options
          .filter((o: any) => o.name.trim().length > 0)
          .map((o: any) => ({
            name: o.name.trim(),
            price: parseFloat(o.price) || 0,
            isDefault: Boolean(o.isDefault),
          })),
      }))
      .filter((g) => g.options.length > 0);

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
        imageUrl: removeImageOnSave ? null : (imageUrl.trim() || null),
        variants: cleanVariants,
        modifierGroups: cleanModifierGroups,
      }, restaurantId);

      // Handle image deletion if requested
      if (removeImageOnSave && !imageFile && item.imageUrl) {
        try {
          await menuService.removeMenuItemImage(item._id, restaurantId);
        } catch (delErr: any) {
          console.warn("Image remove notice:", delErr?.message);
        }
      }

      // Handle image upload if a new file is attached
      if (imageFile) {
        try {
          await menuService.uploadMenuItemImage(item._id, imageFile, restaurantId);
        } catch (imgErr: any) {
          console.warn("Image upload notice:", imgErr?.message);
        }
      }

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
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
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
                  <SelectItem value="OVEN">Oven / Pizza</SelectItem>
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
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
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

          {/* Dish Image Input (File Upload & Preview) */}
          <div className="space-y-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <Label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-500" />
              Item Photo / Image
            </Label>

            {imagePreview || (imageUrl && !removeImageOnSave) ? (
              <div className="flex items-center gap-4 p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview || imageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {imageFile ? imageFile.name : "Current Dish Photo"}
                  </p>
                  {imageFile && (
                    <p className="text-[11px] text-slate-500">
                      {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 text-xs"
                    >
                      Change Photo
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer transition-colors bg-white/50 dark:bg-slate-950/50 group"
              >
                <Upload className="w-8 h-8 mx-auto text-slate-400 group-hover:text-blue-500 transition-colors mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Click to browse image from device
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  JPG, PNG, WebP or GIF (Max 5MB)
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {/* Optional URL input fallback */}
            <div className="pt-1">
              <Input
                placeholder="Or paste direct image URL (https://...)"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setRemoveImageOnSave(false);
                  if (e.target.value) {
                    setImageFile(null);
                    setImagePreview(null);
                  }
                }}
                className="text-xs h-8"
              />
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-800 dark:text-slate-200">Variants &amp; Pricing *</Label>
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
                    <Input
                      required
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Price (₹)"
                      value={variant.price ?? ""}
                      onChange={(e) => updateVariant(index, "price", e.target.value)}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 shrink-0" onClick={() => removeVariant(index)} disabled={variants.length === 1}>
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Modifiers & Add-ons */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Add-ons &amp; Customizations (Optional)
                </Label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure crust types, extra toppings, dips, and paid options.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addModifierGroup}>
                <Plus className="w-4 h-4 mr-1" /> Add Modifier Group
              </Button>
            </div>

            {modifierGroups.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No add-on groups added yet. (e.g. &quot;Crust Selection&quot;, &quot;Extra Toppings&quot;)</p>
            ) : (
              <div className="space-y-4">
                {modifierGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          required
                          placeholder="Group Name (e.g. Crust Selection, Extra Toppings)"
                          value={group.name}
                          onChange={(e) => updateModifierGroup(groupIdx, "name", e.target.value)}
                          className="font-bold text-sm bg-white dark:bg-slate-900"
                        />
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                          <span>Rules:</span>
                          <label className="flex items-center gap-1">
                            Min:
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={group.minSelection ?? ""}
                              onChange={(e) => updateModifierGroup(groupIdx, "minSelection", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-14 h-7 text-xs bg-white dark:bg-slate-900"
                            />
                          </label>
                          <label className="flex items-center gap-1">
                            Max:
                            <Input
                              type="number"
                              min="0"
                              placeholder="1"
                              value={group.maxSelection ?? ""}
                              onChange={(e) => updateModifierGroup(groupIdx, "maxSelection", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-14 h-7 text-xs bg-white dark:bg-slate-900"
                            />
                          </label>
                        </div>
                      </div>
                      <div className="w-40 shrink-0">
                        <Select
                          value={Number(group.maxSelection) === 1 && Number(group.minSelection) === 1 ? "SINGLE" : "MULTIPLE"}
                          onValueChange={(val) => {
                            if (val === "SINGLE") {
                              updateModifierGroup(groupIdx, "minSelection", 1);
                              updateModifierGroup(groupIdx, "maxSelection", 1);
                            } else {
                              updateModifierGroup(groupIdx, "minSelection", 0);
                              updateModifierGroup(groupIdx, "maxSelection", 5);
                            }
                          }}
                        >
                          <SelectTrigger className="bg-white dark:bg-slate-900">
                            <SelectValue placeholder="Selection Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SINGLE">Single Choice (Radio - pick 1)</SelectItem>
                            <SelectItem value="MULTIPLE">Multi Choice (Checkboxes - pick any)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => removeModifierGroup(groupIdx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Options inside this group */}
                    <div className="space-y-2 pl-3 border-l-2 border-purple-300 dark:border-purple-700">
                      <div className="flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-300">
                        <span>Choices / Add-on Items</span>
                        <button
                          type="button"
                          onClick={() => addModifierOption(groupIdx)}
                          className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline font-bold"
                        >
                          <Plus className="w-3.5 h-3.5 mr-0.5" /> Add Choice
                        </button>
                      </div>

                      {group.options.map((opt: any, optIdx: number) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <Input
                            required
                            placeholder="Option Name (e.g. Cheese Burst, Extra Olives)"
                            value={opt.name}
                            onChange={(e) => updateModifierOption(groupIdx, optIdx, "name", e.target.value)}
                            className="bg-white dark:bg-slate-900 h-9 text-xs"
                          />
                          <div className="w-28 shrink-0">
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="+₹ Extra"
                              value={opt.price ?? ""}
                              onChange={(e) => updateModifierOption(groupIdx, optIdx, "price", e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="bg-white dark:bg-slate-900 h-9 text-xs"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-500 h-8 w-8 shrink-0"
                            onClick={() => removeModifierOption(groupIdx, optIdx)}
                            disabled={group.options.length === 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
