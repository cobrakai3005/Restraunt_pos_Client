"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Tag, Trash2, Edit, Pencil, Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restaurantService } from "@/services/restaurant.service";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EditCategoryDialog } from "./edit-category-dialog";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 12;

export function CategoriesTab({ restaurantId }: { restaurantId: string }) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter + Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | true | false
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog Add State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const fetchCategories = async (currentPage = page, filter = statusFilter) => {
    try {
      setIsLoading(true);
      const res = await restaurantService.getCategories(restaurantId, {
        page: currentPage,
        limit: PAGE_SIZE,
        isActive: filter,
      });
      if (res.success) {
        setCategories(res.data.categories || []);
        const meta = res.meta;
        setTotalRecords(meta?.totalRecords ?? res.data.categories?.length ?? 0);
        setTotalPages(meta?.totalPages ?? 1);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load categories", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchCategories(1, "all");
  }, [restaurantId]);

  const handleFilterChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
    fetchCategories(1, v);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchCategories(p, statusFilter);
  };

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    try {
      setIsSubmitting(true);
      await restaurantService.createCategory(restaurantId, formData);
      toast({ title: "Success", description: "Category created" });
      setFormData({ name: "", description: "", isActive: true });
      setIsAddOpen(false);
      fetchCategories(page, statusFilter);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to create",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await restaurantService.deleteCategory(restaurantId, id);
      toast({ title: "Success", description: "Category deleted" });
      fetchCategories(page, statusFilter);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        (cat.name && cat.name.toLowerCase().includes(q)) ||
        (cat.description && cat.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Menu Categories</h3>
          <p className="text-xs text-slate-500">
            Organize dishes into catalog sections.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Search Box */}
          <div className="relative w-full sm:w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="true">Active Only</SelectItem>
              <SelectItem value="false">Inactive Only</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="h-9 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 shrink-0"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Category
          </Button>
        </div>
      </div>

      {isLoading ? (
        /* Loading Skeleton Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 bg-card text-card-foreground border border-border rounded-xl shadow-sm animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-36" />
                </div>
              </div>
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat._id}
              className={`flex items-center justify-between p-4 bg-card text-card-foreground border border-border rounded-xl shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700 ${
                !cat.isActive ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-10 w-10 flex items-center justify-center rounded-lg shrink-0 ${
                    cat.isActive
                      ? "bg-orange-50 text-orange-500 dark:bg-orange-900/20"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}
                >
                  <Tag className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 truncate">
                    <span className="truncate">{cat.name}</span>
                    {!cat.isActive && (
                      <span className="text-[10px] bg-muted text-slate-500 px-2 py-0.5 rounded-full font-medium shrink-0">
                        Inactive
                      </span>
                    )}
                  </div>
                  {cat.description && (
                    <div className="text-xs text-slate-500 truncate max-w-[200px]">
                      {cat.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:bg-blue-900/20"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setIsEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                  onClick={() => handleDelete(cat._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="col-span-full py-10 text-center text-slate-500 border border-dashed rounded-xl border-border">
              {searchQuery
                ? `No categories matching "${searchQuery}".`
                : 'No categories yet. Click "Add Category" to get started.'}
            </div>
          )}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="mb-2 block">
                Category Name <span className="text-rose-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Starters, Beverages"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-2 block">Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <Label>Active Status</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
              />
            </div>
            <Button
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              onClick={handleAdd}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Save Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedCategory && (
        <EditCategoryDialog
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedCategory(null);
          }}
          restaurantId={restaurantId}
          category={selectedCategory}
          onSuccess={() => fetchCategories(page, statusFilter)}
        />
      )}
    </div>
  );
}
