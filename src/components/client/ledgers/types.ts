import { Customer } from "@/services/customer.service";
import { Order } from "@/services/order.service";
import { Vendor } from "@/services/vendor.service";

export interface DueSummary {
  totalOutstandingDue: number;
  totalCollectedDue: number;
  activeDueCount: number;
  settledDueCount: number;
}

export interface VendorLedgerEntry {
  _id: string;
  date: string;
  type: string;
  description?: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface VendorLedgerData {
  closingBalance: number;
  entries: VendorLedgerEntry[];
}

export type { Customer, Order, Vendor };
