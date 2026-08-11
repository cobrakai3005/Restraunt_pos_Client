"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, User, Pencil, Ban, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { restaurantService } from "@/services/restaurant.service";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EditTableDialog } from "./edit-table-dialog";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 12;

export function TablesTab({ restaurantId }: { restaurantId: string }) {
  const { toast } = useToast();
  const [tables, setTables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter + Pagination State
  const [statusFilter, setStatusFilter] = useState("all"); // all | true | false
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog Add State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({ tableNumber: "", capacity: "4", status: "AVAILABLE", isActive: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<any>(null);

  const fetchTables = async (currentPage = page, filter = statusFilter) => {
    try {
      setIsLoading(true);
      const res = await restaurantService.getTables(restaurantId, { page: currentPage, limit: PAGE_SIZE, isActive: filter });
      if (res.success) {
        setTables(res.data.tables || []);
        const meta = res.meta;
        setTotalRecords(meta?.totalRecords ?? res.data.tables?.length ?? 0);
        setTotalPages(meta?.totalPages ?? 1);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load tables", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) fetchTables(1, "all");
  }, [restaurantId]);

  const handleFilterChange = (v: string) => {
    setStatusFilter(v);
    setPage(1);
    fetchTables(1, v);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchTables(p, statusFilter);
  };

  const handleAdd = async () => {
    if (!formData.tableNumber.trim()) return;
    try {
      setIsSubmitting(true);
      await restaurantService.createTable(restaurantId, { 
        tableNumber: formData.tableNumber, 
        capacity: Number(formData.capacity) || 1,
        status: formData.status,
        isActive: formData.isActive
      });
      toast({ title: "Success", description: "Table added" });
      setFormData({ tableNumber: "", capacity: "4", status: "AVAILABLE", isActive: true });
      setIsAddOpen(false);
      fetchTables(page, statusFilter);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to create", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await restaurantService.deleteTable(restaurantId, id);
      toast({ title: "Success", description: "Table deleted" });
      fetchTables(page, statusFilter);
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading tables...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-foreground">Restaurant Tables</h3>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tables</SelectItem>
              <SelectItem value="true">Active Only</SelectItem>
              <SelectItem value="false">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsAddOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add Table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map(table => (
          <div key={table._id} className={`relative group flex flex-col items-center p-4 bg-card text-card-foreground border border-border rounded-2xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all ${!table.isActive ? 'opacity-60 grayscale' : ''}`}>
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" onClick={() => { setSelectedTable(table); setIsEditOpen(true); }} className="h-6 w-6 text-slate-400 hover:text-blue-500">
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(table._id)} className="h-6 w-6 text-slate-400 hover:text-rose-500">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-xl mb-2 ${table.status === 'AVAILABLE' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : table.status === 'OCCUPIED' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-muted text-slate-600'}`}>
              {table.tableNumber}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <User className="h-3 w-3" /> {table.capacity} seats
            </div>
            <div className={`mt-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${table.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : table.status === 'OCCUPIED' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
              {table.status === 'AVAILABLE' && <CheckCircle2 className="h-2.5 w-2.5" />}
              {table.status === 'OCCUPIED' && <Info className="h-2.5 w-2.5" />}
              {table.status === 'RESERVED' && <Ban className="h-2.5 w-2.5" />}
              {table.status}
            </div>
            {!table.isActive && <div className="mt-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Inactive</div>}
          </div>
        ))}
        {tables.length === 0 && (
          <div className="col-span-full py-10 text-center text-slate-500 border border-dashed rounded-xl border-border">
            No tables added yet.
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Table</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Table Number <span className="text-rose-500">*</span></Label>
                <Input placeholder="e.g. T-1" value={formData.tableNumber} onChange={e => setFormData({...formData, tableNumber: e.target.value})} />
              </div>
              <div>
                <Label className="mb-2 block">Capacity <span className="text-rose-500">*</span></Label>
                <Input type="number" min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between py-2">
              <Label>Active Status</Label>
              <Switch 
                checked={formData.isActive}
                onCheckedChange={c => setFormData({...formData, isActive: c})}
              />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={isSubmitting || !formData.tableNumber.trim()}>{isSubmitting ? "Saving..." : "Save Table"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditTableDialog 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
        restaurantId={restaurantId} 
        table={selectedTable} 
        onSuccess={fetchTables} 
      />
    </div>
  );
}
