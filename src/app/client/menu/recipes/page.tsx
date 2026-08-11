"use client";

import { useEffect, useState, useMemo } from "react";
import { clientService } from "@/services/client.service";
import { recipeService, Recipe } from "@/services/recipe.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import CreateRecipeModal from "@/components/client/create-recipe-modal";

export default function RecipesPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string>("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsRestaurantsLoading(true);
    clientService.getRestaurants().then(res => {
      const list = res.data?.restaurants || res.restaurants || res.data || res;
      setRestaurants(list);
      if (list.length > 0) setCurrentRestaurantId(list[0]._id);
    }).catch(err => {
      console.error(err);
      setError("Failed to load restaurants");
    }).finally(() => {
      setIsRestaurantsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (currentRestaurantId) {
      loadRecipes();
    }
  }, [currentRestaurantId]);

  const loadRecipes = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);
    try {
      const res = await recipeService.getRecipes(currentRestaurantId);
      setRecipes(res.data?.recipes || []);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (r: Recipe) => {
    setEditingRecipe(r);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    try {
      await recipeService.deleteRecipe(id, currentRestaurantId);
      loadRecipes();
    } catch (err: any) {
      alert("Failed to delete recipe");
    }
  };

  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return recipes;
    return recipes.filter(r => {
      const itemName = (typeof r.menuItemId === 'object' ? r.menuItemId.name : String(r.menuItemId)) || "";
      const variantName = r.variantName || "";
      const search = searchQuery.toLowerCase();
      return itemName.toLowerCase().includes(search) || variantName.toLowerCase().includes(search);
    });
  }, [recipes, searchQuery]);

  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);
  const paginatedRecipes = filteredRecipes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Recipe / BOM Manager</h1>
          <p className="text-muted-foreground mt-1">Map Menu Items to raw Inventory ingredients to enable auto-deduction of stock on sale.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-full sm:w-72">
            <Select 
              value={currentRestaurantId} 
              onValueChange={setCurrentRestaurantId}
              disabled={isRestaurantsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={isRestaurantsLoading ? "Loading restaurants..." : "Select Restaurant"} />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((rest) => (
                  <SelectItem key={rest._id} value={rest._id}>
                    {rest.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={() => { setEditingRecipe(null); setModalOpen(true); }} className="whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Add Recipe
          </Button>
        </div>
      </div>

      {error && <div className="text-red-500 font-medium">{error}</div>}

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border-b">
            <div className="flex flex-1 items-center space-x-2 w-full max-w-md relative">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
              <Input
                placeholder="Search menu item or variant..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-9 w-full bg-background"
              />
            </div>
            {searchQuery && (
              <Button variant="ghost" onClick={resetFilters} size="sm">Reset</Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              {recipes.length === 0 ? "No recipes found. Create one to get started." : "No recipes match your search."}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Menu Item</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Ingredients</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecipes.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium">
                        {typeof r.menuItemId === 'object' ? r.menuItemId.name : r.menuItemId}
                      </TableCell>
                      <TableCell>{r.variantName}</TableCell>
                      <TableCell>{r.ingredients.length} item(s)</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(r)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(r._id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRecipes.length)} of {filteredRecipes.length} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <div className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {modalOpen && (
        <CreateRecipeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSuccess={loadRecipes}
          existingRecipe={editingRecipe}
          restaurantId={currentRestaurantId}
        />
      )}
    </div>
  );
}
