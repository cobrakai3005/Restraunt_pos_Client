"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoriesTab } from "@/components/client/restaurant/categories-tab";
import { MenuItemsTab } from "@/components/client/restaurant/menu-items-tab";
import { TablesTab } from "@/components/client/restaurant/tables-tab";
import { RecipesTab } from "@/components/client/restaurant/recipes-tab";
import { TasksTab } from "@/components/client/restaurant/tasks-tab";
import { clientService } from "@/services/client.service";

export default function RestaurantDashboard() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  
  const [restaurantName, setRestaurantName] = useState("Loading...");

  useEffect(() => {
    if (restaurantId) {
      // Assuming getRestaurantById exists. If not, we could fetch all and filter, or just use a generic name.
      clientService.getRestaurants().then(res => {
        if (res.success) {
          const rest = res.data.restaurants.find((r: any) => r._id === restaurantId);
          if (rest) setRestaurantName(rest.name);
        }
      });
    }
  }, [restaurantId]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{restaurantName}</h1>
            <p className="text-sm text-slate-500">Manage menus, tables, and settings for this branch.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-4 md:p-6">
        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="categories">
              Categories
            </TabsTrigger>
            <TabsTrigger value="menu">
              Menu Items
            </TabsTrigger>
            <TabsTrigger value="tables">
              Tables
            </TabsTrigger>
            <TabsTrigger value="recipes">
              Recipes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="categories" className="focus-visible:outline-none">
            <CategoriesTab restaurantId={restaurantId} />
          </TabsContent>
          
          <TabsContent value="menu" className="focus-visible:outline-none">
            <MenuItemsTab restaurantId={restaurantId} />
          </TabsContent>
          
          <TabsContent value="tables" className="focus-visible:outline-none">
            <TablesTab restaurantId={restaurantId} />
          </TabsContent>

          <TabsContent value="recipes" className="focus-visible:outline-none">
            <RecipesTab restaurantId={restaurantId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
