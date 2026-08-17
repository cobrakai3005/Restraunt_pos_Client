"use client";

import { useState, useEffect } from "react";
import { Plus, Heart, Star, Briefcase, User, Percent, Sparkles, AlertCircle, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { customerService, Customer } from "@/services/customer.service";
import { toast } from "@/components/ui/use-toast";

interface AddCustomerDialogProps {
  restaurantId: string;
  onSuccess: () => void;
  customerToEdit?: Customer | any;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultName?: string;
}

const TAG_OPTIONS: {
  value: "NORMAL" | "FRIEND" | "VIP" | "STAFF";
  label: string;
  icon: any;
  color: string;
  activeBorder: string;
  desc: string;
  defaultDiscount: { type: "NONE" | "PERCENTAGE" | "FIXED"; value: number };
}[] = [
  {
    value: "FRIEND",
    label: "Friend",
    icon: Heart,
    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    activeBorder: "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/50",
    desc: "Friend / Family (10% Discount)",
    defaultDiscount: { type: "PERCENTAGE", value: 10 },
  },
  {
    value: "VIP",
    label: "VIP Guest",
    icon: Star,
    color: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    activeBorder: "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/60 dark:bg-purple-950/50",
    desc: "Priority VIP (15% Discount)",
    defaultDiscount: { type: "PERCENTAGE", value: 15 },
  },
  {
    value: "STAFF",
    label: "Staff Member",
    icon: Briefcase,
    color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    activeBorder: "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/60 dark:bg-amber-950/50",
    desc: "Internal Staff (20% Discount)",
    defaultDiscount: { type: "PERCENTAGE", value: 20 },
  },
  {
    value: "NORMAL",
    label: "Regular / Walk-in",
    icon: User,
    color: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    activeBorder: "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30",
    desc: "Standard customer (No Discount)",
    defaultDiscount: { type: "NONE", value: 0 },
  },
];

export function AddCustomerDialog({
  restaurantId,
  onSuccess,
  customerToEdit,
  trigger,
  open: controlledOpen,
  onOpenChange,
  defaultName,
}: AddCustomerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    setInternalOpen(val);
    onOpenChange?.(val);
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    tags: "FRIEND" as "NORMAL" | "FRIEND" | "VIP" | "STAFF",
    discountType: "PERCENTAGE" as "NONE" | "PERCENTAGE" | "FIXED",
    discountValue: 10,
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setError("");
      if (customerToEdit) {
        setFormData({
          name: customerToEdit.name || "",
          phone: customerToEdit.phone || "",
          email: customerToEdit.email || "",
          address: customerToEdit.address || "",
          tags: customerToEdit.tags || "NORMAL",
          discountType: customerToEdit.discountType || "NONE",
          discountValue: customerToEdit.discountValue ?? 0,
          notes: customerToEdit.notes || "",
        });
      } else {
        setFormData({
          name: defaultName || "",
          phone: "",
          email: "",
          address: "",
          tags: "FRIEND",
          discountType: "PERCENTAGE",
          discountValue: 10,
          notes: "",
        });
      }
    }
  }, [open, customerToEdit, defaultName]);

  const handleTagSelect = (tag: "NORMAL" | "FRIEND" | "VIP" | "STAFF") => {
    const preset = TAG_OPTIONS.find((t) => t.value === tag);
    setFormData((prev) => ({
      ...prev,
      tags: tag,
      discountType: preset ? preset.defaultDiscount.type : "NONE",
      discountValue: preset ? preset.defaultDiscount.value : 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Customer phone number is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        tags: formData.tags,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue) || 0,
        notes: formData.notes.trim() || undefined,
      };

      if (customerToEdit) {
        await customerService.updateCustomer(customerToEdit._id, payload, restaurantId);
        toast({ title: "Customer updated ✅", description: `${payload.name} updated successfully.` });
      } else {
        await customerService.createCustomer(payload, restaurantId);
        toast({ title: "Customer created 🎉", description: `${payload.name} (${payload.tags}) registered successfully.` });
      }
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || `Failed to ${customerToEdit ? "update" : "create"} customer`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ? (
            trigger
          ) : (
            <Button className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700 shadow-sm gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[560px] max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-0 rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-0">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {customerToEdit ? "Edit Customer Profile" : "Register New Customer / VIP"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {customerToEdit
                  ? "Update customer identity, affiliation tag, and automated discount rules."
                  : "Create a customer profile to enable automated Friend/VIP discounts and loyalty recognition."}
              </DialogDescription>
            </DialogHeader>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-6 space-y-5">
            {/* Tag / Category Selector */}
            <div className="space-y-2">
              <Label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                Customer Classification / Tag <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                {TAG_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = formData.tags === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleTagSelect(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? opt.activeBorder
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`p-1.5 rounded-lg ${opt.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{opt.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cust-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Ramesh Sharma"
                  className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-phone" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <div className="flex">
                  <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-r-0 rounded-l-xl px-3 flex items-center text-slate-500 text-xs font-bold">
                    +91
                  </div>
                  <Input
                    id="cust-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))
                    }
                    placeholder="9876543210"
                    className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-r-xl rounded-l-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Discount Rules */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-extrabold uppercase tracking-widest text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-600" /> Applicable Discount Rule
                </Label>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Auto-applied in Cashier POS</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "NONE", label: "No Discount" },
                  { value: "PERCENTAGE", label: "Percentage (%)" },
                  { value: "FIXED", label: "Fixed Rupee (₹)" },
                ].map((dt) => (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        discountType: dt.value as any,
                        discountValue: dt.value === "NONE" ? 0 : prev.discountValue || 10,
                      }))
                    }
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      formData.discountType === dt.value
                        ? "bg-white dark:bg-slate-900 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>

              {formData.discountType !== "NONE" && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        {formData.discountType === "PERCENTAGE" ? "%" : "₹"}
                      </span>
                      <Input
                        type="number"
                        min={0}
                        max={formData.discountType === "PERCENTAGE" ? 100 : 10000}
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))
                        }
                        placeholder={formData.discountType === "PERCENTAGE" ? "10" : "100"}
                        className="pl-8 h-10 bg-white dark:bg-slate-900 font-bold text-sm rounded-xl border-slate-300 dark:border-slate-700"
                      />
                    </div>

                    {/* Quick percentage chips */}
                    {formData.discountType === "PERCENTAGE" && (
                      <div className="flex gap-1.5">
                        {[5, 10, 15, 20, 25].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, discountValue: p }))}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                              formData.discountValue === p
                                ? "bg-purple-600 text-white"
                                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-purple-300"
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Email & Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cust-email" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. guest@example.com"
                  className="h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-address" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Address / City <span className="text-slate-400 font-normal">(Optional)</span>
                </Label>
                <Input
                  id="cust-address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Park Street, Kolkata"
                  className="h-10 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Relationship Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="cust-notes" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Relationship Notes / Loyalty Context <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="cust-notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Owner's close family friend, prefers outdoor seating, corporate discount"
                rows={2}
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="p-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl border-slate-300 dark:border-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-5 shadow-md shadow-purple-600/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {loading ? (customerToEdit ? "Updating..." : "Saving...") : customerToEdit ? "Update Profile" : "Register Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
