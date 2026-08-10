"use client";

import { useEffect, useState } from "react";
import { Utensils, LayoutList, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { clientService } from "@/services/client.service";
import { menuService, Category, MenuItem } from "@/services/menu.service";
import { AddCategoryDialog } from "@/components/client/add-category-dialog";
import { AddMenuItemDialog } from "@/components/client/add-menu-item-dialog";
import { EditMenuItemDialog } from "@/components/client/edit-menu-item-dialog";
import { toast } from "@/components/ui/use-toast";

interface Restaurant {
  _id: string;
  name: string;
}

export default function ClientMenuPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchCategories(selectedRestaurantId);
      fetchMenuItems(selectedRestaurantId);
    } else {
      setCategories([]);
      setMenuItems([]);
    }
  }, [selectedRestaurantId]);

  const fetchRestaurants = async () => {
    try {
      const res = await clientService.getRestaurants();
      
      let restaurantList = [];
      if (Array.isArray(res)) {
        restaurantList = res;
      } else if (res.data && Array.isArray(res.data)) {
        restaurantList = res.data;
      } else if (res.data && res.data.restaurants && Array.isArray(res.data.restaurants)) {
        restaurantList = res.data.restaurants;
      } else if (res.restaurants && Array.isArray(res.restaurants)) {
        restaurantList = res.restaurants;
      }

      setRestaurants(restaurantList);
      if (restaurantList.length > 0) {
        setSelectedRestaurantId(restaurantList[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    }
  };

  const fetchCategories = async (restaurantId: string) => {
    try {
      const res = await menuService.getCategories(restaurantId);
      let catList = [];
      if (Array.isArray(res)) catList = res;
      else if (res.data && Array.isArray(res.data)) catList = res.data;
      else if (res.data && res.data.categories && Array.isArray(res.data.categories)) catList = res.data.categories;
      else if (res.categories && Array.isArray(res.categories)) catList = res.categories;
      
      setCategories(catList);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchMenuItems = async (restaurantId: string) => {
    try {
      const res = await menuService.getMenuItems(restaurantId);
      let itemList = [];
      if (Array.isArray(res)) itemList = res;
      else if (res.data && Array.isArray(res.data)) itemList = res.data;
      else if (res.data && res.data.menuItems && Array.isArray(res.data.menuItems)) itemList = res.data.menuItems;
      else if (res.menuItems && Array.isArray(res.menuItems)) itemList = res.menuItems;

      setMenuItems(itemList);
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    }
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
        variant: "destructive" 
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
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="space-y-6">
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
          <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
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
              Menu Items
            </TabsTrigger>
            <TabsTrigger 
              value="categories"
              className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400"
            >
              <LayoutList className="w-4 h-4 mr-2" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* MENU ITEMS TAB */}
          <TabsContent value="items" className="mt-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white">Active Menu Items</CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">Dishes available for order.</CardDescription>
                </div>
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
              </CardHeader>
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
                    {menuItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center h-32 text-slate-500 dark:text-slate-400">
                          No menu items found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      menuItems.map((item) => (
                        <TableRow key={item._id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            {typeof item.categoryId === 'object' ? item.categoryId.name : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={item.isVeg ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}>
                              {item.isVeg ? "Veg" : "Non-Veg"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            <div className="flex gap-1 flex-wrap">
                              {item.variants.map((v, i) => (
                                <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-xs font-normal">
                                  {v.name}: ₹{v.price}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            {item.station}
                          </TableCell>
                          <TableCell>
                            <Badge className={item.isAvailable ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-red-100 text-red-800 hover:bg-red-100"}>
                              {item.isAvailable ? "Available" : "Out of Stock"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
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
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="mt-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <CardTitle className="text-slate-900 dark:text-white">Menu Categories</CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">Organize your menu items.</CardDescription>
                </div>
                <AddCategoryDialog 
                  restaurantId={selectedRestaurantId} 
                  onSuccess={() => fetchCategories(selectedRestaurantId)} 
                />
              </CardHeader>
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
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-32 text-slate-500 dark:text-slate-400">
                          No categories found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((cat) => (
                        <TableRow key={cat._id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <TableCell className="font-medium text-slate-900 dark:text-white">
                            {cat.name}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-300">
                            {cat.description || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
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
    </div>
  );
}
