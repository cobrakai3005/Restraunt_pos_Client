"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { recipeService } from "@/services/recipe.service";
import { InventoryItem } from "@/services/inventory.service";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface MenuItemVariant {
  name: string;
  price: number;
}

interface MenuItem {
  _id: string;
  name: string;
  variants: MenuItemVariant[];
}

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  restaurantId: string;
  menuItems: MenuItem[];
  inventoryItems: InventoryItem[];
}

export function AddRecipeDialog({
  open,
  onOpenChange,
  onSuccess,
  restaurantId,
  menuItems,
  inventoryItems,
}: AddRecipeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [menuItemId, setMenuItemId] = useState("");
  const [variantName, setVariantName] = useState("");
  const [ingredients, setIngredients] = useState<{ inventoryItemId: string; quantityUsed: number | string }[]>([]);

  // Find the selected menu item to get its variants
  const selectedMenuItem = menuItems.find(m => m._id === menuItemId);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: "", quantityUsed: "" }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: string, value: any) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuItemId || !variantName) {
      toast({ variant: "destructive", title: "Please select a Menu Item and Variant" });
      return;
    }
    
    // Filter out invalid ingredients
    const validIngredients = ingredients
      .map(i => ({ ...i, quantityUsed: Number(i.quantityUsed) }))
      .filter(i => i.inventoryItemId && !isNaN(i.quantityUsed) && i.quantityUsed > 0);
      
    if (validIngredients.length === 0) {
      toast({ variant: "destructive", title: "Please add at least one valid ingredient" });
      return;
    }

    try {
      setLoading(true);
      await recipeService.createRecipe({
        menuItemId,
        variantName,
        ingredients: validIngredients,
      }, restaurantId);

      toast({ title: "Success", description: "Recipe created successfully." });
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setMenuItemId("");
      setVariantName("");
      setIngredients([]);
    } catch (error: any) {
      console.error("Failed to create recipe:", error);
      toast({ 
        variant: "destructive", 
        title: "Failed to create recipe", 
        description: error?.response?.data?.message || "Ensure a recipe doesn't already exist for this variant."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Recipe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Menu Item *</Label>
              <Select 
                value={menuItemId} 
                onValueChange={(val) => {
                  setMenuItemId(val);
                  setVariantName(""); // Reset variant when item changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Menu Item" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Variant *</Label>
              <Select 
                value={variantName} 
                onValueChange={setVariantName}
                disabled={!selectedMenuItem}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Variant" />
                </SelectTrigger>
                <SelectContent>
                  {selectedMenuItem?.variants.map((v) => (
                    <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Ingredients</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddIngredient}>
                <Plus className="h-4 w-4 mr-2" /> Add Ingredient
              </Button>
            </div>

            {ingredients.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No ingredients added yet.</p>
            )}

            {ingredients.map((ing, index) => (
              <div key={index} className="flex items-end gap-3 p-3 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Inventory Item</Label>
                  <Select 
                    value={ing.inventoryItemId} 
                    onValueChange={(val) => handleIngredientChange(index, "inventoryItemId", val)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems.map((inv) => (
                        <SelectItem key={inv._id} value={inv._id}>{inv.name} ({inv.unit})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24 space-y-2">
                  <Label className="text-xs">Quantity</Label>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.001" 
                    required 
                    value={ing.quantityUsed}
                    onChange={(e) => handleIngredientChange(index, "quantityUsed", e.target.value)}
                    className="bg-background"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleRemoveIngredient(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Recipe
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
