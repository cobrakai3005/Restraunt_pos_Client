"use client";

import { useEffect } from "react";
import { Tags, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoriesTab } from "@/components/client/restaurant/categories-tab";
import { useClientRestaurants } from "@/hooks/queries/use-portal-queries";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setClientSelectedRestaurantId } from "@/store/portal-ui-slice";

interface Restaurant {
  _id: string;
  name: string;
}

export default function ClientCategoriesPage() {
  const dispatch = useAppDispatch();
  const selectedRestaurantId = useAppSelector((state) => state.portalUi.clientSelectedRestaurantId);
  const { data: restaurants = [], isLoading } = useClientRestaurants();

  useEffect(() => {
    if (restaurants.length && !restaurants.some((restaurant: Restaurant) => restaurant._id === selectedRestaurantId)) {
      dispatch(setClientSelectedRestaurantId(restaurants[0]._id));
    }
  }, [dispatch, restaurants, selectedRestaurantId]);

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
              onValueChange={(restaurantId) => dispatch(setClientSelectedRestaurantId(restaurantId))}
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
