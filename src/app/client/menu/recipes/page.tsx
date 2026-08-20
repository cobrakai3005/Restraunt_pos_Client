"use client";

import { useEffect, useState, useMemo } from "react";
import { clientService } from "@/services/client.service";
import { recipeService, Recipe } from "@/services/recipe.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Plus,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  UploadCloud,
  X,
  BookOpen,
  Edit,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import CreateRecipeModal from "@/components/client/create-recipe-modal";
import { BulkImportDialog } from "@/components/client/bulk-import-dialog";
import { recipeBulkImportConfig } from "@/lib/bulk-import-configs";
import { toast } from "@/components/ui/use-toast";

export default function RecipesPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string>("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRestaurantsLoading, setIsRestaurantsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setIsRestaurantsLoading(true);
    clientService
      .getRestaurants()
      .then((res) => {
        const list = res.data?.restaurants || res.restaurants || res.data || res;
        setRestaurants(list);
        if (list.length > 0) setCurrentRestaurantId(list[0]._id);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load restaurants");
      })
      .finally(() => {
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
      toast({ title: "Deleted", description: "Recipe deleted successfully." });
      loadRecipes();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete recipe.",
        variant: "destructive",
      });
    }
  };

  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return recipes;
    const search = searchQuery.toLowerCase().trim();
    return recipes.filter((r) => {
      const itemName = (typeof r.menuItemId === "object" ? r.menuItemId.name : String(r.menuItemId)) || "";
      const variantName = r.variantName || "";
      const ingredientsMatch = r.ingredients?.some((ing: any) => {
        const ingName = typeof ing.inventoryItemId === "object" ? ing.inventoryItemId.name : "";
        return ingName?.toLowerCase().includes(search);
      });
      return (
        itemName.toLowerCase().includes(search) ||
        variantName.toLowerCase().includes(search) ||
        ingredientsMatch
      );
    });
  }, [recipes, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecipes.length / pageSize));
  const paginatedRecipes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecipes.slice(start, start + pageSize);
  }, [filteredRecipes, currentPage, pageSize]);

  const resetFilters = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            Recipe &amp; BOM Manager
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Map menu items and variants to raw inventory ingredients for automated stock reduction upon sale.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-72">
            <Select
              value={currentRestaurantId}
              onValueChange={setCurrentRestaurantId}
              disabled={isRestaurantsLoading}
            >
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectValue
                  placeholder={isRestaurantsLoading ? "Loading restaurants..." : "Select Restaurant"}
                />
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBulkImportOpen(true)}
              className="gap-2 shrink-0 bg-white dark:bg-slate-900"
            >
              <UploadCloud className="h-4 w-4" /> Bulk Import
            </Button>
            <Button
              onClick={() => {
                setEditingRecipe(null);
                setModalOpen(true);
              }}
              className="gap-2 shrink-0 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Add Recipe
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
          {error}
        </div>
      )}

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              Configured Recipes (BOM)
              <Badge variant="secondary" className="text-xs font-semibold">
                {filteredRecipes.length} {filteredRecipes.length === 1 ? "recipe" : "recipes"}
              </Badge>
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Active bill-of-materials and ingredient portion mappings.
            </CardDescription>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search dish, variant, ingredient..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={resetFilters}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Menu Item</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Variant</TableHead>
                <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Ingredients (Consumption Per Unit)</TableHead>
                <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                /* Skeleton Loading Rows */
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx} className="animate-pulse border-slate-100 dark:border-slate-800">
                    <TableCell>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-24" />
                        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedRecipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-32 text-slate-500 dark:text-slate-400">
                    {searchQuery
                      ? `No recipes matching "${searchQuery}".`
                      : "No recipes found. Click 'Add Recipe' to create a bill of materials."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecipes.map((r) => (
                  <TableRow
                    key={r._id}
                    className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="font-bold text-slate-900 dark:text-white">
                      {typeof r.menuItemId === "object" ? r.menuItemId.name : r.menuItemId}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      <Badge variant="outline" className="font-medium bg-slate-50 dark:bg-slate-800">
                        {r.variantName || "Standard"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1.5">
                        {r.ingredients.map((ing: any, i: number) => {
                          const name = typeof ing.inventoryItemId === "object" ? ing.inventoryItemId.name : "Item";
                          const unit = ing.unit || (typeof ing.inventoryItemId === "object" ? ing.inventoryItemId.unit : "");
                          return (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="bg-slate-100 dark:bg-slate-800 text-[11px] font-normal"
                            >
                              {name}: {ing.quantityUsed} {unit || ""}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          onClick={() => handleEdit(r)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(r._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* ── Pagination Footer ── */}
          {filteredRecipes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
              <div className="flex items-center gap-3 text-slate-500">
                <span className="text-slate-500">
                  {filteredRecipes.length === 0 ? (
                    "Showing 0 of 0 recipes"
                  ) : (
                    <>
                      Showing{" "}
                      <strong>
                        {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredRecipes.length)}
                      </strong>{" "}
                      of <strong>{filteredRecipes.length}</strong> recipes
                    </>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Rows:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(val) => {
                      setPageSize(Number(val));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-7 w-16 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="px-3 font-semibold text-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
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

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        restaurantId={currentRestaurantId}
        config={recipeBulkImportConfig}
        onSuccess={loadRecipes}
      />
    </div>
  );
}
