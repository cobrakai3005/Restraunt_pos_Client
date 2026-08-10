"use client";

import { useState, useEffect } from "react";
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
import { customerService } from "@/services/customer.service";
import { toast } from "@/components/ui/use-toast";

interface AddCustomerDialogProps {
  restaurantId: string;
  onSuccess: () => void;
  customerToEdit?: any;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultName?: string;
}

export function AddCustomerDialog({ restaurantId, onSuccess, customerToEdit, trigger, open: controlledOpen, onOpenChange, defaultName }: AddCustomerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: customerToEdit?.name || "",
    phone: customerToEdit?.phone || "",
    email: customerToEdit?.email || "",
    address: customerToEdit?.address || "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: customerToEdit?.name || defaultName || "",
        phone: customerToEdit?.phone || "",
        email: customerToEdit?.email || "",
        address: customerToEdit?.address || "",
      });
    }
  }, [open, customerToEdit, defaultName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "Validation Error", description: "Customer name is required", variant: "destructive" });
      return;
    }
    
    try {
      setLoading(true);
      if (customerToEdit) {
        await customerService.updateCustomer(customerToEdit._id, formData, restaurantId);
        toast({ title: "Success", description: "Customer updated successfully" });
      } else {
        await customerService.createCustomer(formData, restaurantId);
        toast({ title: "Success", description: "Customer created successfully" });
      }
      setOpen(false);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
      });
      onSuccess();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || `Failed to ${customerToEdit ? "update" : "create"} customer`,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ? trigger : (
            <Button className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">
              {customerToEdit ? "Edit Customer" : "Create New Customer"}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {customerToEdit ? "Update customer details below." : "Fill in the form to add a new customer."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Mobile Number / WhatsApp</Label>
                <div className="flex">
                  <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-r-0 rounded-l-md px-3 flex items-center text-slate-500 text-sm">
                    +91
                  </div>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="98765 43210"
                    className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 rounded-l-none"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email ID</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john.doe@example.com"
                  className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Address Line (Street/Building)</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 456 Park Avenue"
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
              className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              {loading ? (customerToEdit ? "Updating..." : "Creating...") : (customerToEdit ? "Update Customer" : "Create Customer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
