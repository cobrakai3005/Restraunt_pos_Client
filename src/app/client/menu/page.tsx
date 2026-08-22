"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Utensils,
  LayoutList,
  Trash2,
  Edit,
  UploadCloud,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { menuService, Category, MenuItem } from "@/services/menu.service";
import { AddCategoryDialog } from "@/components/client/add-category-dialog";
import { AddMenuItemDialog } from "@/components/client/add-menu-item-dialog";
import { EditMenuItemDialog } from "@/components/client/edit-menu-item-dialog";
import { BulkImportDialog } from "@/components/client/bulk-import-dialog";
import { menuBulkImportConfig } from "@/lib/bulk-import-configs";
import { toast } from "@/components/ui/use-toast";
import { useClientMenuCategories, useClientMenuItems, useClientRestaurants } from "@/hooks/queries/use-portal-queries";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setClientSelectedRestaurantId } from "@/store/portal-ui-slice";

interface Restaurant {
  _id: string;
  name: string;
}

export default function ClientMenuPage() {
  const dispatch = useAppDispatch();
  const selectedRestaurantId = useAppSelector((state) => state.portalUi.clientSelectedRestaurantId);
  const { data: restaurants = [] } = useClientRestaurants();
  const categoriesQuery = useClientMenuCategories(selectedRestaurantId);
  const menuItemsQuery = useClientMenuItems(selectedRestaurantId);
  const categories = (categoriesQuery.data ?? []) as Category[];
  const menuItems = (menuItemsQuery.data ?? []) as MenuItem[];
  const isLoadingItems = menuItemsQuery.isLoading || menuItemsQuery.isFetching;
  const isLoadingCategories = categoriesQuery.isLoading || categoriesQuery.isFetching;

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  // ── Search & Filter State for Menu Items ──
  const [itemSearch, setItemSearch] = useState("");
  const [itemCategoryFilter, setItemCategoryFilter] = useState("ALL");
  const [itemTypeFilter, setItemTypeFilter] = useState("ALL"); // ALL | VEG | NON_VEG
  const [itemStationFilter, setItemStationFilter] = useState("ALL");
  const [itemAvailabilityFilter, setItemAvailabilityFilter] = useState("ALL"); // ALL | AVAILABLE | UNAVAILABLE

  // Pagination for Menu Items
  const [itemPage, setItemPage] = useState(1);
  const [itemPageSize, setItemPageSize] = useState(10);

  // ── Search & Filter State for Categories ──
  const [catSearch, setCatSearch] = useState("");
  const [catPage, setCatPage] = useState(1);
  const [catPageSize, setCatPageSize] = useState(10);

  useEffect(() => {
    if (restaurants.length && !restaurants.some((restaurant: Restaurant) => restaurant._id === selectedRestaurantId)) {
      dispatch(setClientSelectedRestaurantId(restaurants[0]._id));
    }
  }, [dispatch, restaurants, selectedRestaurantId]);

  useEffect(() => {
    // Reset pagination on restaurant switch
    setItemPage(1);
    setCatPage(1);
  }, [selectedRestaurantId]);

  const fetchCategories = async (_restaurantId: string) => {
    await categoriesQuery.refetch();
  };

  const fetchMenuItems = async (_restaurantId: string) => {
    await menuItemsQuery.refetch();
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This will fail if menu items are attached to it.")) return;
    try {
      await menuService.deleteCategory(id, selectedRestaurantId);
      toast({ title: "Deleted", description: "Category deleted successfully." });
      fetchCategories(selectedRestaurantId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await menuService.deleteMenuItem(id, selectedRestaurantId);
      toast({ title: "Deleted", description: "Menu item deleted successfully." });
      fetchMenuItems(selectedRestaurantId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete menu item.",
        variant: "destructive",
      });
    }
  };

  // ── Filtered & Paginated Menu Items ──
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const q = itemSearch.trim().toLowerCase();
      const catName = typeof item.categoryId === "object" ? item.categoryId?.name?.toLowerCase() || "" : "";
      const catId = typeof item.categoryId === "object" ? item.categoryId?._id : item.categoryId;

      // 1. Text search
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        catName.includes(q) ||
        (item.station && item.station.toLowerCase().includes(q)) ||
        (item.shortCode && item.shortCode.toLowerCase().includes(q)) ||
        (item.numericCode && item.numericCode.toLowerCase().includes(q)) ||
        item.variants.some((v) => v.name.toLowerCase().includes(q) || String(v.price).includes(q));

      // 2. Category filter
      const matchesCategory = itemCategoryFilter === "ALL" || catId === itemCategoryFilter;

      // 3. Type filter (Veg / Non-Veg)
      const matchesType =
        itemTypeFilter === "ALL" ||
        (itemTypeFilter === "VEG" && item.isVeg) ||
        (itemTypeFilter === "NON_VEG" && !item.isVeg);

      // 4. Station filter
      const matchesStation = itemStationFilter === "ALL" || item.station === itemStationFilter;

      // 5. Availability filter
      const matchesAvailability =
        itemAvailabilityFilter === "ALL" ||
        (itemAvailabilityFilter === "AVAILABLE" && item.isAvailable) ||
        (itemAvailabilityFilter === "UNAVAILABLE" && !item.isAvailable);

      return matchesSearch && matchesCategory && matchesType && matchesStation && matchesAvailability;
    });
  }, [
    menuItems,
    itemSearch,
    itemCategoryFilter,
    itemTypeFilter,
    itemStationFilter,
    itemAvailabilityFilter,
  ]);

  const totalItemPages = Math.max(1, Math.ceil(filteredMenuItems.length / itemPageSize));
  const paginatedMenuItems = useMemo(() => {
    const start = (itemPage - 1) * itemPageSize;
    return filteredMenuItems.slice(start, start + itemPageSize);
  }, [filteredMenuItems, itemPage, itemPageSize]);

  // ── Filtered & Paginated Categories ──
  const filteredCategories = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    return categories.filter(
      (cat) =>
        !q ||
        cat.name.toLowerCase().includes(q) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    );
  }, [categories, catSearch]);

  const totalCatPages = Math.max(1, Math.ceil(filteredCategories.length / catPageSize));
  const paginatedCategories = useMemo(() => {
    const start = (catPage - 1) * catPageSize;
    return filteredCategories.slice(start, start + catPageSize);
  }, [filteredCategories, catPage, catPageSize]);

  const clearItemFilters = () => {
    setItemSearch("");
    setItemCategoryFilter("ALL");
    setItemTypeFilter("ALL");
    setItemStationFilter("ALL");
    setItemAvailabilityFilter("ALL");
    setItemPage(1);
  };

  const isAnyItemFilterActive =
    itemSearch !== "" ||
    itemCategoryFilter !== "ALL" ||
    itemTypeFilter !== "ALL" ||
    itemStationFilter !== "ALL" ||
    itemAvailabilityFilter !== "ALL";

  return (
    <div className="space-y-6">
      {/* Header & Restaurant Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            Menu Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage categories and menu items across your restaurants.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Select value={selectedRestaurantId} onValueChange={(restaurantId) => dispatch(setClientSelectedRestaurantId(restaurantId))}>
            <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder="Select Restaurant" />
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
      </div>

      {!selectedRestaurantId ? (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardContent className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400">
            <Utensils className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a restaurant to view menu.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg">
            <TabsTrigger
              value="items"
              className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Menu Items ({menuItems.length})
            </TabsTrigger>
            <TabsTrigger
              value="categories"
              className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400"
            >
              <LayoutList className="w-4 h-4 mr-2" />
              Categories ({categories.length})
            </TabsTrigger>
          </TabsList>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* MENU ITEMS TAB */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <TabsContent value="items" className="mt-6 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                    Active Menu Items
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {filteredMenuItems.length} {filteredMenuItems.length === 1 ? "dish" : "dishes"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">
                    Dishes available for order across your digital &amp; physical menus.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.length > 0 ? (
                    <AddMenuItemDialog
                      restaurantId={selectedRestaurantId}
                      categories={categories}
                      onSuccess={() => fetchMenuItems(selectedRestaurantId)}
                    />
                  ) : (
                    <Button disabled variant="outline" title="Create a category first">
                      Add Menu Item
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkImportOpen(true)}
                    disabled={categories.length === 0}
                    title={categories.length === 0 ? "Create a category first" : "Bulk import menu items"}
                    className="gap-2"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Bulk Import
                  </Button>
                </div>
              </CardHeader>

              {/* ── Search & Filter Bar ── */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {/* Text Search */}
                  <div className="relative lg:col-span-2">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search dish, variant, code..."
                      value={itemSearch}
                      onChange={(e) => {
                        setItemSearch(e.target.value);
                        setItemPage(1);
                      }}
                      className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                    {itemSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setItemSearch("");
                          setItemPage(1);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div>
                    <Select
                      value={itemCategoryFilter}
                      onValueChange={(val) => {
                        setItemCategoryFilter(val);
                        setItemPage(1);
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Categories</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dietary Type Filter */}
                  <div>
                    <Select
                      value={itemTypeFilter}
                      onValueChange={(val) => {
                        setItemTypeFilter(val);
                        setItemPage(1);
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="All Food Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Food Types</SelectItem>
                        <SelectItem value="VEG">🟢 Veg Only</SelectItem>
                        <SelectItem value="NON_VEG">🔴 Non-Veg Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Kitchen Station Filter */}
                  <div>
                    <Select
                      value={itemStationFilter}
                      onValueChange={(val) => {
                        setItemStationFilter(val);
                        setItemPage(1);
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="All Stations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Stations</SelectItem>
                        <SelectItem value="MAIN_KITCHEN">Main Kitchen</SelectItem>
                        <SelectItem value="BAR">Bar</SelectItem>
                        <SelectItem value="TANDOOR">Tandoor</SelectItem>
                        <SelectItem value="GRILL">Grill</SelectItem>
                        <SelectItem value="BAKERY">Bakery</SelectItem>
                        <SelectItem value="COLD_KITCHEN">Cold Kitchen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <Select
                      value={itemAvailabilityFilter}
                      onValueChange={(val) => {
                        setItemAvailabilityFilter(val);
                        setItemPage(1);
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="UNAVAILABLE">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Filter indicator & reset */}
                {isAnyItemFilterActive && (
                  <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Filter className="w-3.5 h-3.5 text-blue-600" />
                      Filtered results: <strong>{filteredMenuItems.length}</strong> of <strong>{menuItems.length}</strong> items
                    </span>
                    <button
                      type="button"
                      onClick={clearItemFilters}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-bold text-xs flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Reset all filters
                    </button>
                  </div>
                )}
              </div>

              {/* ── Table Content ── */}
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Category</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Type</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Variants (Price)</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Station</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingItems ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <TableRow key={idx} className="animate-pulse border-slate-100 dark:border-slate-800">
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0" />
                              <div className="space-y-1.5">
                                <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded w-14" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell><div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-20" /></TableCell>
                          <TableCell><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-14" /></TableCell>
                          <TableCell><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></TableCell>
                          <TableCell><div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-16" /></TableCell>
                          <TableCell><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16" /></TableCell>
                          <TableCell className="text-right">
                            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-16 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedMenuItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-32 text-slate-500 dark:text-slate-400">
                          {isAnyItemFilterActive ? "No menu items match the filter criteria." : "No menu items found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMenuItems.map((item) => (
                        <TableRow
                          key={item._id}
                          className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2.5">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                                  <Utensils className="w-4 h-4" />
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                                {item.shortCode && (
                                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                                    #{item.shortCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            {typeof item.categoryId === "object" ? item.categoryId.name : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                item.isVeg
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                  : "border-red-200 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
                              }
                            >
                              {item.isVeg ? "Veg" : "Non-Veg"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            <div className="flex gap-1 flex-wrap">
                              {item.variants.map((v, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="bg-slate-100 dark:bg-slate-800 text-xs font-normal"
                                >
                                  {v.name}: ₹{v.price}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300 text-xs font-semibold">
                            {item.station}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                item.isAvailable
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
                              }
                            >
                              {item.isAvailable ? "Available" : "Out of Stock"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteMenuItem(item._id)}
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

                {/* ── Menu Items Pagination Footer ── */}
                {filteredMenuItems.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span className="text-slate-500">
                        {filteredMenuItems.length === 0 ? (
                          "Showing 0 of 0 items"
                        ) : (
                          <>
                            Showing{" "}
                            <strong>
                              {(itemPage - 1) * itemPageSize + 1}–{Math.min(itemPage * itemPageSize, filteredMenuItems.length)}
                            </strong>{" "}
                            of <strong>{filteredMenuItems.length}</strong> items
                          </>
                        )}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Rows:</span>
                        <Select
                          value={String(itemPageSize)}
                          onValueChange={(val) => {
                            setItemPageSize(Number(val));
                            setItemPage(1);
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
                        disabled={itemPage <= 1}
                        onClick={() => setItemPage(1)}
                        title="First Page"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={itemPage <= 1}
                        onClick={() => setItemPage((p) => Math.max(1, p - 1))}
                        title="Previous Page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <span className="px-3 font-semibold text-slate-700 dark:text-slate-300">
                        Page {itemPage} of {totalItemPages}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={itemPage >= totalItemPages}
                        onClick={() => setItemPage((p) => Math.min(totalItemPages, p + 1))}
                        title="Next Page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={itemPage >= totalItemPages}
                        onClick={() => setItemPage(totalItemPages)}
                        title="Last Page"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* CATEGORIES TAB */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          <TabsContent value="categories" className="mt-6 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                    Menu Categories
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {filteredCategories.length} {filteredCategories.length === 1 ? "category" : "categories"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">
                    Organize your dishes into browsable catalog sections.
                  </CardDescription>
                </div>
                <AddCategoryDialog
                  restaurantId={selectedRestaurantId}
                  onSuccess={() => fetchCategories(selectedRestaurantId)}
                />
              </CardHeader>

              {/* Search Category Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search category name or description..."
                    value={catSearch}
                    onChange={(e) => {
                      setCatSearch(e.target.value);
                      setCatPage(1);
                    }}
                    className="pl-9 h-9 text-xs rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  />
                  {catSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatSearch("");
                        setCatPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Name</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Description</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCategories ? (
                      Array.from({ length: 4 }).map((_, idx) => (
                        <TableRow key={idx} className="animate-pulse border-slate-100 dark:border-slate-800">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800 shrink-0" />
                              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" />
                            </div>
                          </TableCell>
                          <TableCell><div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-48" /></TableCell>
                          <TableCell className="text-right">
                            <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-8 ml-auto" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : paginatedCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-32 text-slate-500 dark:text-slate-400">
                          {catSearch ? "No categories match the search criteria." : "No categories found."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCategories.map((cat) => (
                        <TableRow
                          key={cat._id}
                          className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <LayoutList className="w-4 h-4 text-slate-400" />
                              <span className="font-bold">{cat.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300 text-xs">
                            {cat.description || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              onClick={() => handleDeleteCategory(cat._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* ── Categories Pagination Footer ── */}
                {filteredCategories.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span className="text-slate-500">
                        {filteredCategories.length === 0 ? (
                          "Showing 0 of 0 categories"
                        ) : (
                          <>
                            Showing{" "}
                            <strong>
                              {(catPage - 1) * catPageSize + 1}–{Math.min(catPage * catPageSize, filteredCategories.length)}
                            </strong>{" "}
                            of <strong>{filteredCategories.length}</strong> categories
                          </>
                        )}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Rows:</span>
                        <Select
                          value={String(catPageSize)}
                          onValueChange={(val) => {
                            setCatPageSize(Number(val));
                            setCatPage(1);
                          }}
                        >
                          <SelectTrigger className="h-7 w-16 text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={catPage <= 1}
                        onClick={() => setCatPage(1)}
                        title="First Page"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={catPage <= 1}
                        onClick={() => setCatPage((p) => Math.max(1, p - 1))}
                        title="Previous Page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <span className="px-3 font-semibold text-slate-700 dark:text-slate-300">
                        Page {catPage} of {totalCatPages}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={catPage >= totalCatPages}
                        onClick={() => setCatPage((p) => Math.min(totalCatPages, p + 1))}
                        title="Next Page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        disabled={catPage >= totalCatPages}
                        onClick={() => setCatPage(totalCatPages)}
                        title="Last Page"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {editingItem && (
        <EditMenuItemDialog
          item={editingItem}
          restaurantId={selectedRestaurantId}
          categories={categories}
          open={isEditDialogOpen}
          onOpenChange={(val) => {
            setIsEditDialogOpen(val);
            if (!val) setEditingItem(null);
          }}
          onSuccess={() => fetchMenuItems(selectedRestaurantId)}
        />
      )}

      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
        restaurantId={selectedRestaurantId}
        config={menuBulkImportConfig}
        onSuccess={() => fetchMenuItems(selectedRestaurantId)}
      />
    </div>
  );
}
