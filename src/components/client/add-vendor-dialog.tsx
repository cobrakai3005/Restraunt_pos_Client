"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { vendorService } from "@/services/vendor.service";
import { toast } from "@/components/ui/use-toast";

interface AddVendorDialogProps {
  restaurantId: string;
  onSuccess: () => void;
}

export function AddVendorDialog({ restaurantId, onSuccess }: AddVendorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstNumber: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "Validation Error", description: "Vendor name is required", variant: "destructive" });
      return;
    }
    
    try {
      setLoading(true);
      await vendorService.createVendor(formData, restaurantId);
      toast({ title: "Success", description: "Vendor created successfully" });
      setOpen(false);
      setFormData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        gstNumber: "",
        address: "",
      });
      onSuccess();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || "Failed to create vendor",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">Add New Vendor</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Create a new supplier profile for your purchases.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                Vendor Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Kirana Store"
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="contactPerson" className="text-slate-700 dark:text-slate-300">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gstNumber" className="text-slate-700 dark:text-slate-300">GST Number</Label>
              <Input
                id="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Store address..."
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>
          
          <DialogFooter>
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
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {loading ? "Creating..." : "Create Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
