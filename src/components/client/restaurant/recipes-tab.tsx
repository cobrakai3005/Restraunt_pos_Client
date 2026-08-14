"use client";

import { useEffect, useState } from "react";
import { Plus, ChefHat, Edit, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { restaurantService } from "@/services/restaurant.service";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { recipeService, Recipe } from "@/services/recipe.service";
import { AddRecipeDialog } from "@/components/client/add-recipe-dialog";
import { EditRecipeDialog } from "@/components/client/edit-recipe-dialog";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "@/components/ui/use-toast";
import { BulkImportDialog } from "@/components/client/bulk-import-dialog";
import { recipeBulkImportConfig } from "@/lib/bulk-import-configs";

const PAGE_SIZE = 10;

export function RecipesTab({ restaurantId }: { restaurantId: string }) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (restaurantId) {
      fetchRecipes(restaurantId, 1);
      fetchMenuItems(restaurantId);
      fetchInventoryItems(restaurantId);
    }
  }, [restaurantId]);

  const fetchRecipes = async (id: string, currentPage = page) => {
    try {
      const res = await recipeService.getRecipes(id, { page: currentPage, limit: PAGE_SIZE });
      if (res?.data?.recipes && Array.isArray(res.data.recipes)) {
        setRecipes(res.data.recipes);
        setTotalRecords(res.meta?.totalRecords ?? res.data.recipes.length);
        setTotalPages(res.meta?.totalPages ?? 1);
      } else if (res?.data && Array.isArray(res.data)) {
        setRecipes(res.data);
        setTotalRecords(res.data.length);
        setTotalPages(1);
      } else if (Array.isArray(res)) {
        setRecipes(res);
        setTotalRecords(res.length);
        setTotalPages(1);
      } else {
        setRecipes([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to fetch recipes", error);
    }
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchRecipes(restaurantId, p);
  };

  const fetchMenuItems = async (id: string) => {
    try {
      const res = await restaurantService.getMenuItems(id);
      if (res?.data?.menuItems && Array.isArray(res.data.menuItems)) {
        setMenuItems(res.data.menuItems);
      } else if (res?.data && Array.isArray(res.data)) {
        setMenuItems(res.data);
      } else if (Array.isArray(res)) {
        setMenuItems(res);
      }
    } catch (error) {
      console.error("Failed to fetch menu items", error);
    }
  };

  const fetchInventoryItems = async (id: string) => {
    try {
      const res = await inventoryService.getInventoryItems(id);
      if (res?.data?.inventoryItems && Array.isArray(res.data.inventoryItems)) {
        setInventoryItems(res.data.inventoryItems);
      } else if (res?.data && Array.isArray(res.data)) {
        setInventoryItems(res.data);
      } else if (Array.isArray(res)) {
        setInventoryItems(res);
      }
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    try {
      await recipeService.deleteRecipe(id, restaurantId);
      toast({ title: "Success", description: "Recipe deleted successfully." });
      fetchRecipes(restaurantId, page);
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to delete recipe" });
    }
  };

  const openEditDialog = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Recipes</h2>
          <p className="text-sm text-slate-500">Map menu items to their ingredients for automatic inventory deduction.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsBulkImportOpen(true)}
            disabled={menuItems.length === 0 || inventoryItems.length === 0}
            title={menuItems.length === 0 || inventoryItems.length === 0 ? "Add menu items and inventory items first" : "Bulk import recipes"}
          >
            <UploadCloud className="mr-2 h-4 w-4" /> Bulk Import
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Recipe
          </Button>
        </div>
      </div>

      {recipes.length > 0 ? (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Menu Item</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Ingredients</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map((recipe) => (
                <TableRow key={recipe._id}>
                  <TableCell className="font-medium">
                    {typeof recipe.menuItemId === 'object' ? recipe.menuItemId?.name : recipe.menuItemId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-background">
                      {recipe.variantName}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {recipe.ingredients.length} items
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(recipe)}
                      className="hover:text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(recipe._id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
          <div className="h-20 w-20 rounded-full bg-blue-100/50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <ChefHat className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No recipes found</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Get started by adding a recipe for your menu items.
          </p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> Add First Recipe
          </Button>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      <AddRecipeDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        onSuccess={() => fetchRecipes(restaurantId, page)}
        restaurantId={restaurantId}
        menuItems={menuItems}
        inventoryItems={inventoryItems}
      />

      <EditRecipeDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => fetchRecipes(restaurantId, page)}
        restaurantId={restaurantId}
        menuItems={menuItems}
        inventoryItems={inventoryItems}
        recipe={editingRecipe}
      />

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        restaurantId={restaurantId}
        config={recipeBulkImportConfig}
        onSuccess={() => fetchRecipes(restaurantId, page)}
      />
    </div>
  );
}
