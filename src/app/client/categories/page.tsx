"use client";

import { useEffect, useState } from "react";
import { Tags, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientService } from "@/services/client.service";
import { CategoriesTab } from "@/components/client/restaurant/categories-tab";

interface Restaurant {
  _id: string;
  name: string;
}

export default function ClientCategoriesPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const res = await clientService.getRestaurants();
      if (res.success && res.data.restaurants) {
        setRestaurants(res.data.restaurants);
        if (res.data.restaurants.length > 0) {
          setSelectedRestaurantId(res.data.restaurants[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch restaurants", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Category Management</h1>
          <p className="text-sm text-slate-500">Create, organize, and manage food and beverage menu categories.</p>
        </div>
        
        {restaurants.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Restaurant:</span>
            <Select
              value={selectedRestaurantId}
              onValueChange={setSelectedRestaurantId}
            >
              <SelectTrigger className="w-[200px] bg-background">
                <SelectValue placeholder="Select Restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r._id} value={r._id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {restaurants.length === 0 && !isLoading ? (
        <Card className="rounded-2xl border border-dashed p-8 text-center">
          <CardContent className="space-y-2">
            <Store className="mx-auto h-8 w-8 text-slate-400" />
            <p className="font-semibold text-slate-700 dark:text-slate-200">No Restaurants Found</p>
            <p className="text-sm text-slate-500">Create a restaurant branch first to manage categories.</p>
          </CardContent>
        </Card>
      ) : selectedRestaurantId ? (
        <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm p-4 md:p-6">
          <CategoriesTab restaurantId={selectedRestaurantId} />
        </div>
      ) : null}
    </div>
  );
}
