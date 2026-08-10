"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Store, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clientService } from "@/services/client.service";
import { useToast } from "@/components/ui/use-toast";
import { AddRestaurantDialog } from "@/components/client/add-restaurant-dialog";
import { EditRestaurantDialog } from "@/components/client/edit-restaurant-dialog";

export default function RestaurantsPage() {
  const { toast } = useToast();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const res = await clientService.getRestaurants();
      if (res.success) {
        setRestaurants(res.data.restaurants || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load restaurants.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this restaurant? This cannot be undone.")) return;
    try {
      await clientService.deleteRestaurant(id);
      toast({ title: "Success", description: "Restaurant deleted." });
      fetchRestaurants();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete restaurant." });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Restaurants</h1>
          <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-3 py-1 text-sm font-medium text-blue-700">
            {restaurants.length} branches
          </span>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="rounded-full bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Restaurant
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <span className="text-sm text-slate-500">Loading restaurants...</span>
        </div>
      ) : restaurants.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((rest) => (
            <div key={rest._id} className="flex flex-col rounded-3xl border border-border bg-card text-card-foreground p-6 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <Store className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg text-foreground">{rest.name}</h3>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => { setSelectedRestaurant(rest); setIsEditOpen(true); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20 rounded-md transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(rest._id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-slate-500">
                    <MapPin className="mr-1 h-3.5 w-3.5" />
                    <span>Branch {rest._id.substring(rest._id.length - 4)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <Link href={`/client/restaurants/${rest._id}`}>
                  <Button variant="outline" className="w-full rounded-full border-blue-200 dark:border-blue-800 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/20">
                    Manage Branch
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card text-card-foreground gap-2">
          <span className="text-sm text-slate-500">You haven't added any restaurants yet.</span>
          <Button variant="link" onClick={() => setIsAddOpen(true)}>Add your first restaurant</Button>
        </div>
      )}

      <AddRestaurantDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        onSuccess={fetchRestaurants}
      />

      <EditRestaurantDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        restaurant={selectedRestaurant}
        onSuccess={fetchRestaurants}
      />
    </div>
  );
}
