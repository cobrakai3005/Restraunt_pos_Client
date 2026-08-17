"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2, AlertCircle, Sparkles, Star, Heart, Briefcase, User } from "lucide-react";
import { customerService, Customer } from "@/services/customer.service";
import { useToast } from "@/components/ui/use-toast";

interface CreateCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialName?: string;
  onCustomerCreated: (customer: Customer) => void;
}

const TAG_OPTIONS: { value: "NORMAL" | "FRIEND" | "VIP" | "STAFF"; label: string; icon: any; color: string; desc: string; defaultDiscount: { type: "NONE" | "PERCENTAGE" | "FIXED"; value: number } }[] = [
  {
    value: "FRIEND",
    label: "Friend",
    icon: Heart,
    color: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    desc: "Personal friend / guest (Default: 10% Discount)",
    defaultDiscount: { type: "PERCENTAGE", value: 10 },
  },
  {
    value: "VIP",
    label: "VIP Guest",
    icon: Star,
    color: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    desc: "Priority VIP diner (Default: 15% Discount)",
    defaultDiscount: { type: "PERCENTAGE", value: 15 },
  },
  {
    value: "STAFF",
    label: "Staff / Internal",
    icon: Briefcase,
    color: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    desc: "Restaurant team member / staff perk",
    defaultDiscount: { type: "PERCENTAGE", value: 20 },
  },
  {
    value: "NORMAL",
    label: "Regular / Loyalty",
    icon: User,
    color: "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    desc: "Regular customer profile",
    defaultDiscount: { type: "NONE", value: 0 },
  },
];

export function CreateCustomerDialog({
  isOpen,
  onClose,
  initialPhone = "",
  initialName = "",
  onCustomerCreated,
}: CreateCustomerDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState("");
  const [tag, setTag] = useState<"NORMAL" | "FRIEND" | "VIP" | "STAFF">("FRIEND");
  const [discountType, setDiscountType] = useState<"NONE" | "PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setPhone(initialPhone);
      setError("");
    }
  }, [isOpen, initialName, initialPhone]);

  const handleSelectTag = (selectedTag: "NORMAL" | "FRIEND" | "VIP" | "STAFF") => {
    setTag(selectedTag);
    const preset = TAG_OPTIONS.find((t) => t.value === selectedTag);
    if (preset) {
      setDiscountType(preset.defaultDiscount.type);
      setDiscountValue(preset.defaultDiscount.value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter customer name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter customer phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const response = await customerService.createCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        tags: tag,
        discountType,
        discountValue: discountType === "NONE" ? 0 : Number(discountValue) || 0,
        notes: notes.trim(),
      });

      const newCustomer = response.data;
      toast({
        title: `Customer Registered: ${newCustomer.name} (${newCustomer.tags || tag})`,
        description: discountType !== "NONE" ? `${discountType === "PERCENTAGE" ? `${discountValue}%` : `₹${discountValue}`} discount configured.` : "Customer saved.",
      });

      onCustomerCreated(newCustomer);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to create customer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-base font-extrabold text-white">
                Register VIP / Friend Customer
              </DialogTitle>
              <p className="text-xs text-white/80 mt-0.5">
                Save persistent profile with automatic discount entitlements
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-xs font-semibold rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-xs font-semibold rounded-xl"
                required
              />
            </div>
          </div>

          {/* Tag Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Customer Classification / Tag
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {TAG_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = tag === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectTag(opt.value)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-950/40"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 ${opt.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                        {opt.label}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configured Discount */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Default Discount Configuration
              </span>
              <span className="text-[11px] text-slate-400">Rules applied on POS order</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-500">Discount Type</Label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full h-9 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 text-slate-900 dark:text-white focus:outline-hidden"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Flat Amount (₹)</option>
                  <option value="NONE">No Default Discount</option>
                </select>
              </div>

              {discountType !== "NONE" && (
                <div className="space-y-1">
                  <Label className="text-[11px] text-slate-500">
                    {discountType === "PERCENTAGE" ? "Percentage Value (%)" : "Flat Value (₹)"}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={discountType === "PERCENTAGE" ? 100 : 10000}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="h-9 text-xs font-bold rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Relationship / Notes <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              placeholder="e.g. Owner's college friend, preferred table 4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl px-5 gap-1.5 shadow-md shadow-blue-600/20"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              Save &amp; Link Customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
