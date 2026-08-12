import React, { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { AddInventoryDialog } from "./add-inventory-dialog";
import { EditInventoryDialog } from "./edit-inventory-dialog";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function InventoryTab() {
  const { toast } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getInventoryItems();
      if (res.data) {
        setItems(res.data);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch inventory items",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Reset to page 1 when search or page size changes
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await inventoryService.deleteInventoryItem(id);
      toast({ title: "Deleted", description: "Item removed from inventory" });
      fetchItems();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete item",
      });
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory Management</h2>
          <p className="text-slate-500 dark:text-slate-400">Track and manage raw materials</p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search inventory items..."
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-4 font-medium w-12">#</th>
                <th className="px-6 py-4 font-medium">Item Name</th>
                <th className="px-6 py-4 font-medium">Stock Level</th>
                <th className="px-6 py-4 font-medium">Cost / Unit</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading inventory...
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, idx) => {
                  const isLowStock = item.currentStock <= item.reorderLevel;
                  const rowNum = (safePage - 1) * pageSize + idx + 1;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-4 text-slate-400 dark:text-slate-600 font-mono text-xs">{rowNum}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.unit}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 ${isLowStock ? "text-orange-600 dark:text-orange-400 font-medium" : ""}`}>
                          {Number(item.currentStock).toFixed(2)} {item.unit}
                          {isLowStock && <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div className="text-xs text-slate-500">Reorder at: {Number(item.reorderLevel).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">₹{item.costPerUnit.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        }`}>
                          {item.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditItem(item)}
                            className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item._id)}
                            className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {!loading && filteredItems.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {(safePage - 1) * pageSize + 1}
              </span>
              {" – "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.min(safePage * pageSize, filteredItems.length)}
              </span>
              {" of "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {filteredItems.length}
              </span>{" "}
              items
            </p>

            <div className="flex items-center gap-1">
              {/* First page */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(1)}
                disabled={safePage === 1}
                className="h-8 w-8 rounded-lg border-slate-300 dark:border-slate-700 disabled:opacity-40"
                title="First page"
              >
                <span className="flex"><ChevronLeft className="h-3 w-3" /><ChevronLeft className="h-3 w-3 -ml-1.5" /></span>
              </Button>

              {/* Prev page */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="h-8 w-8 rounded-lg border-slate-300 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page number pills */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="px-1 text-slate-400 text-xs">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition-all border ${
                        safePage === p
                          ? "bg-blue-600 text-white border-blue-600 shadow"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              {/* Next page */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="h-8 w-8 rounded-lg border-slate-300 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Last page */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(totalPages)}
                disabled={safePage === totalPages}
                className="h-8 w-8 rounded-lg border-slate-300 dark:border-slate-700 disabled:opacity-40"
                title="Last page"
              >
                <span className="flex"><ChevronRight className="h-3 w-3" /><ChevronRight className="h-3 w-3 -ml-1.5" /></span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddInventoryDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={fetchItems}
      />

      <EditInventoryDialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        item={editItem}
        onSuccess={fetchItems}
      />
    </div>
  );
}
