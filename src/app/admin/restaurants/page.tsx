"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Store, MapPin, Building2, Pencil, Trash2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminService } from "@/services/admin.service";
import { useToast } from "@/components/ui/use-toast";
import { AddAdminRestaurantDialog } from "@/components/admin/add-restaurant-dialog";
import { EditAdminRestaurantDialog } from "@/components/admin/edit-restaurant-dialog";
import { Input } from "@/components/ui/input";
import { useAdminRestaurants } from "@/hooks/queries/use-portal-queries";

export default function AdminRestaurantsPage() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [search, setSearch] = useState("");

  const restaurantsQuery = useAdminRestaurants();
  const restaurants = restaurantsQuery.data?.data?.restaurants || [];
  const isLoading = restaurantsQuery.isLoading || restaurantsQuery.isFetching;

  const filteredRestaurants = restaurants.filter((r: any) =>
    r.name?.toLowerCase().includes(search.toLowerCase()) || 
    r.clientId?.contactName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this restaurant? This cannot be undone.")) return;
    try {
      await adminService.deleteRestaurant(id);
      toast({ title: "Success", description: "Restaurant deleted." });
      restaurantsQuery.refetch();
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

      <div className="flex items-center justify-between rounded-xl border border-border bg-card text-card-foreground p-4 shadow-sm">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">Restaurant Overview</span>
          <span className="text-sm text-slate-500">View and manage all restaurants assigned to clients across the platform.</span>
        </div>
        <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
      </div>
      
      <div className="relative max-w-md">
        <Input 
          placeholder="Search restaurants or clients..." 
          className="pl-4 rounded-full border-border bg-card text-card-foreground"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <span className="text-sm text-slate-500">Loading restaurants...</span>
        </div>
      ) : filteredRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRestaurants.map((rest: any) => (
            <div key={rest._id} className="flex flex-col justify-between rounded-3xl border border-border bg-card text-card-foreground p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
              <div>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                    <Store className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg text-foreground">{rest.name}</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => { setSelectedRestaurant(rest); setIsEditOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20 rounded-md transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(rest._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-slate-500">
                      <MapPin className="mr-1 h-3.5 w-3.5" />
                      <span>ID: {rest._id.substring(rest._id.length - 6)}</span>
                      {!rest.isActive && (
                        <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700 font-medium">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Assigned Client</p>
                  <div className="flex items-center text-sm text-slate-700 dark:text-slate-300">
                    <Building2 className="mr-2 h-4 w-4 text-slate-400" />
                    <span className="font-medium">{rest.clientId?.contactName || "Unknown"}</span>
                  </div>
                </div>
              </div>

              <Link href={`/admin/restaurants/${rest._id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40">
                <Settings2 className="h-4 w-4" />
                Manage Restaurant
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card text-card-foreground gap-2">
          <Store className="h-8 w-8 text-slate-300 mb-2" />
          <span className="text-sm text-slate-500">No restaurants found.</span>
        </div>
      )}

      <AddAdminRestaurantDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        onSuccess={() => restaurantsQuery.refetch()}
      />

      <EditAdminRestaurantDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        restaurant={selectedRestaurant}
        onSuccess={() => restaurantsQuery.refetch()}
      />
    </div>
  );
}
