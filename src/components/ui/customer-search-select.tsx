"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronsUpDown, User, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Customer } from "@/services/customer.service";

interface CustomerSearchSelectProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string, customer?: Customer | null) => void;
  placeholder?: string;
  className?: string;
}

export function CustomerSearchSelect({
  customers = [],
  selectedCustomerId = "ALL",
  onSelectCustomer,
  placeholder = "Search or select customer (Name / Mobile)...",
  className = "",
}: CustomerSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Find currently selected customer
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId || selectedCustomerId === "ALL") return null;
    return customers.find((c) => c._id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Sync display query with selected customer
  useEffect(() => {
    if (selectedCustomer) {
      setQuery(`${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ""}`);
    } else {
      setQuery("");
    }
  }, [selectedCustomer]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset query text to match selected customer name if user typed but didn't click
        if (selectedCustomer) {
          setQuery(`${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ""}`);
        } else {
          setQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCustomer]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (!query.trim()) return customers;
    // If the query matches the selected customer's full label, show full list
    if (selectedCustomer && query.trim() === `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ""}`.trim()) {
      return customers;
    }
    const q = query.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, query, selectedCustomer]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery("");
    onSelectCustomer("ALL", null);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            // If user cleared text completely, reset filter to ALL
            if (e.target.value.trim() === "" && selectedCustomerId !== "ALL") {
              onSelectCustomer("ALL", null);
            }
          }}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-16 text-xs font-semibold rounded-xl bg-white dark:bg-slate-950 border border-input focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:focus:ring-amber-400/40 text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs transition-all"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {selectedCustomerId !== "ALL" && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
              title="Clear customer filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>
      </div>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
          {/* Option: All Customers */}
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onSelectCustomer("ALL", null);
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
              selectedCustomerId === "ALL"
                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>👥 All Customers (View All Credit)</span>
            </div>
            {selectedCustomerId === "ALL" && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
          </button>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          {/* List of matching customers */}
          {filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No matching customers found
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const isSelected = customer._id === selectedCustomerId;
              return (
                <button
                  key={customer._id}
                  type="button"
                  onClick={() => {
                    setQuery(`${customer.name}${customer.phone ? ` (${customer.phone})` : ""}`);
                    onSelectCustomer(customer._id, customer);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-extrabold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {customer.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        {customer.phone && <span>📱 {customer.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {Number(customer.outstandingDue ?? customer.closingBalance ?? 0) > 0 && (
                      <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded-md">
                        Due: ₹{Number(customer.outstandingDue ?? customer.closingBalance ?? 0).toLocaleString("en-IN")}
                      </span>
                    )}
                    {customer.tags && customer.tags !== "NORMAL" && (
                      <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0">
                        {customer.tags}
                      </Badge>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
