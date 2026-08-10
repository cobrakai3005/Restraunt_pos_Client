"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { purchaseService, PurchaseItem } from "@/services/purchase.service";
import { vendorService, Vendor } from "@/services/vendor.service";
import { inventoryService, InventoryItem } from "@/services/inventory.service";
import { toast } from "@/components/ui/use-toast";

interface AddPurchaseDialogProps {
  restaurantId: string;
  onSuccess: () => void;
}

export function AddPurchaseDialog({ restaurantId, onSuccess }: AddPurchaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const [vendorName, setVendorName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    if (open && restaurantId) {
      fetchVendors();
      fetchInventory();
    }
  }, [open, restaurantId]);

  const fetchVendors = async () => {
    try {
      const res = await vendorService.getVendors(restaurantId);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res.data && Array.isArray(res.data)) list = res.data;
      else if (res.data && res.data.vendors && Array.isArray(res.data.vendors)) list = res.data.vendors;
      else if (res.vendors && Array.isArray(res.vendors)) list = res.vendors;
      setVendors(list);
    } catch (error) {
      console.error("Failed to fetch vendors", error);
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await inventoryService.getInventoryItems(restaurantId);
      let list = [];
      if (Array.isArray(res)) list = res;
      else if (res.data && Array.isArray(res.data)) list = res.data;
      else if (res.data && res.data.inventoryItems && Array.isArray(res.data.inventoryItems)) list = res.data.inventoryItems;
      else if (res.inventoryItems && Array.isArray(res.inventoryItems)) list = res.inventoryItems;
      setInventoryItems(list);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { inventoryItemId: "", quantity: 1, ratePerUnit: 0, totalAmount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    
    // @ts-ignore
    item[field] = value;
    
    if (field === "quantity" || field === "ratePerUnit") {
      item.totalAmount = item.quantity * item.ratePerUnit;
    }
    
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName) return toast({ title: "Error", description: "Select a vendor", variant: "destructive" });
    if (!invoiceNumber) return toast({ title: "Error", description: "Invoice number is required", variant: "destructive" });
    if (items.length === 0) return toast({ title: "Error", description: "Add at least one item", variant: "destructive" });
    
    // Validate items
    for (const item of items) {
      if (!item.inventoryItemId) return toast({ title: "Error", description: "Select an item for all rows", variant: "destructive" });
      if (item.quantity <= 0) return toast({ title: "Error", description: "Quantity must be > 0", variant: "destructive" });
    }

    try {
      setLoading(true);
      await purchaseService.createPurchase({
        vendorName,
        invoiceNumber,
        invoiceDate,
        items,
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount
      }, restaurantId);
      
      toast({ title: "Success", description: "Purchase recorded successfully" });
      setOpen(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to save purchase",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVendorName("");
    setInvoiceNumber("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setItems([]);
    setTaxAmount(0);
    setPaidAmount(0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Log Purchase
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Create Purchase Transaction</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Log an inward bill from a vendor. This will automatically increase inventory stock.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Header Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
              <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">Vendor <span className="text-red-500">*</span></Label>
                <Select value={vendorName} onValueChange={setVendorName}>
                  <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Select Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.length === 0 && <SelectItem value="none" disabled>No vendors found</SelectItem>}
                    {vendors.map(v => (
                      <SelectItem key={v._id} value={v.name}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">Invoice Number <span className="text-red-500">*</span></Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-..."
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-slate-700 dark:text-slate-300">Invoice Date</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  required
                />
              </div>
            </div>
            
            {/* Items Grid */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-slate-900 dark:text-white">Items & Services</h4>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="w-3 h-3 mr-1" /> Add Row
                </Button>
              </div>
              
              <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Product/Item</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300 w-24">Qty</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300 w-32">Rate (₹)</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-600 dark:text-slate-300 w-32">Total</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                          Click "Add Row" to select items.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="bg-white dark:bg-slate-900">
                          <td className="px-3 py-2">
                            <Select 
                              value={item.inventoryItemId} 
                              onValueChange={(val) => handleItemChange(idx, "inventoryItemId", val)}
                            >
                              <SelectTrigger className="border-slate-200 dark:border-slate-800 h-9">
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent>
                                {inventoryItems.map(inv => (
                                  <SelectItem key={inv._id} value={inv._id}>
                                    {inv.name} ({inv.unit})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                              className="h-9"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.ratePerUnit}
                              onChange={(e) => handleItemChange(idx, "ratePerUnit", parseFloat(e.target.value) || 0)}
                              className="h-9"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">
                            ₹{item.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveItem(idx)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Box */}
            <div className="flex justify-end">
              <div className="w-64 space-y-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                  <span className="font-medium text-slate-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm gap-4">
                  <span className="text-slate-600 dark:text-slate-400">Tax Amount:</span>
                  <Input 
                    type="number" 
                    className="w-24 h-8 text-right bg-white dark:bg-slate-900" 
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center font-bold text-lg">
                  <span className="text-slate-900 dark:text-white">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm gap-4">
                  <span className="text-slate-600 dark:text-slate-400">Paid Now:</span>
                  <Input 
                    type="number" 
                    className="w-24 h-8 text-right bg-white dark:bg-slate-900" 
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 -mx-6 -mb-6 p-4 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || items.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
