import { User as AuthUser } from "@/services/auth.service";
import { UtensilsCrossed, Flame, Calculator, FileText, BarChart3 } from "lucide-react";

export interface DashboardProps {
  user: AuthUser;
  onOpenDrawer?: () => void;
  currentMode?: Mode;
  onModeChange?: (mode: Mode) => void;
}

export interface KotItem {
  _id: string;
  menuItemId: { name: string; station?: string; imageUrl?: string };
  variantName?: string;
  variantPrice: number;
  quantity: number;
  itemStatus: string;
  cgstPercent: number;
  sgstPercent: number;
  isComplimentary?: boolean;
  complimentaryReason?: string;
  complimentaryBy?: any;
  complimentaryAt?: string;
}

export interface Order {
  _id: string;
  orderNumber?: number;
  tableId?: { tableNumber: string };
  orderType: string;
  kots: { items: KotItem[] }[];
  status: string;
  paymentStatus?: string;
  financials?: {
    subtotal: number;
    totalTax: number;
    totalCgst?: number;
    totalSgst?: number;
    packagingCharge?: number;
    discount?: number;
    discountType?: "NONE" | "PERCENTAGE" | "FIXED" | "MANUAL";
    discountValue?: number;
    discountReason?: string;
    discountAppliedBy?: { contactName: string; role: string };
    grandTotal: number;
    paidAmount?: number;
    dueAmount?: number;
    dueStatus?: "NONE" | "PARTIAL" | "PENDING" | "PAID";
    payments?: Array<{ method: string; amount: number }>;
    duePayments?: Array<{
      _id?: string;
      amount: number;
      method: string;
      receivedBy?: { contactName?: string; role?: string } | string;
      receivedAt: string;
      notes?: string;
    }>;
  };
  customerDetails?: {
    name?: string;
    phone?: string;
    customerId?: {
      _id: string;
      name: string;
      phone?: string;
      tags?: "NORMAL" | "FRIEND" | "VIP" | "STAFF";
      discountType?: "NONE" | "PERCENTAGE" | "FIXED";
      discountValue?: number;
    } | string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export type Mode = "orders" | "kitchen" | "billing" | "receivables" | "reports";

export const TABS: { id: Mode; label: string; description: string; icon: React.ElementType; activeClass: string; dotClass: string }[] = [
  {
    id: "orders",
    label: "Take Orders",
    description: "Take new orders and fire them to the kitchen",
    icon: UtensilsCrossed,
    activeClass: "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30",
    dotClass: "bg-blue-500",
  },
  {
    id: "kitchen",
    label: "Kitchen",
    description: "Pick up ready food and hand it over",
    icon: Flame,
    activeClass: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30",
    dotClass: "bg-orange-500",
  },
  {
    id: "billing",
    label: "Billing & Settlements",
    description: "Generate bills, settle payments and close orders",
    icon: Calculator,
    activeClass: "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30",
    dotClass: "bg-emerald-500",
  },
  {
    id: "receivables",
    label: "Credit / Khata",
    description: "Manage credit dues and receive customer payments",
    icon: FileText,
    activeClass: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30",
    dotClass: "bg-amber-500",
  },
  {
    id: "reports",
    label: "POS Reports",
    description: "View executive sales, category, item and cover reports",
    icon: BarChart3,
    activeClass: "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30",
    dotClass: "bg-indigo-500",
  },
];

export function calculateOrderFinancials(order: Order | null) {
  if (!order) {
    return {
      subtotal: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalTax: 0,
      packagingCharge: 0,
      discount: 0,
      grandTotal: 0,
    };
  }

  const discount = Math.max(0, Number(order.financials?.discount || 0));

  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;

  order.kots?.forEach((kot) => {
    kot.items?.forEach((item) => {
      const isComp = Boolean(item.isComplimentary);
      const itemTotal = isComp ? 0 : Number(item.variantPrice || 0) * Number(item.quantity || 0);

      subtotal += itemTotal;

      const cgstPercent = Number(item.cgstPercent || 0);
      const sgstPercent = Number(item.sgstPercent || 0);

      totalCgst += isComp ? 0 : (itemTotal * cgstPercent) / 100;
      totalSgst += isComp ? 0 : (itemTotal * sgstPercent) / 100;
    });
  });

  subtotal = Math.round(subtotal);
  const roundedCgst = Math.round(totalCgst);
  const roundedSgst = Math.round(totalSgst);
  const totalTax = roundedCgst + roundedSgst;

  const packagingCharge =
    order.financials?.packagingCharge !== undefined
      ? order.financials.packagingCharge
      : order.orderType === "TAKEAWAY"
      ? 20
      : 0;

  const grandTotal =
    order.financials?.grandTotal !== undefined &&
    order.financials.grandTotal > 0 &&
    (order.status === "BILLED" || order.status === "PAID")
      ? order.financials.grandTotal
      : Math.max(0, subtotal + totalTax + packagingCharge - discount);

  return {
    subtotal,
    totalCgst: roundedCgst,
    totalSgst: roundedSgst,
    totalTax,
    packagingCharge,
    discount,
    grandTotal,
  };
}
