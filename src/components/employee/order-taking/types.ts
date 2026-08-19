import { ModifierGroup } from "@/services/menu.service";
import { SelectedModifier } from "../variant-picker-dialog";
import { Customer } from "@/services/customer.service";

export const PRESET_COOKING_NOTES = [
  "Less Spicy",
  "No Onion/Garlic",
  "Extra Spicy",
  "Jain",
  "Less Oil",
  "Takeaway Pack",
];

export interface Menu {
  _id: string;
  name: string;
  categoryId: {
    _id: string;
    name: string;
  };
  variants: {
    _id?: string;
    name: string;
    price: number;
    sku?: string;
  }[];
  modifierGroups?: ModifierGroup[];
  station: string;
  isAvailable: boolean;
  imageUrl?: string | null;
  isVeg?: boolean | null;
  shortCode?: string | null;
  numericCode?: string | null;
}

export interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  status: string;
  mergedIntoTableId?: any;
  mergedIntoOrderId?: any;
}

export interface CartItem extends Menu {
  cartId: string;
  quantity: number;
  notes: string;
  selectedVariant: {
    name: string;
    price: number;
  };
  selectedModifiers?: SelectedModifier[];
}

export interface Order {
  _id: string;
  orderNumber?: number;
  guestCount?: number;
  tableId?: {
    _id: string;
    tableNumber: string;
  };
  tableIds?: Array<{
    _id?: string;
    tableNumber?: string;
    section?: string;
  } | string>;
  mergedIntoOrderId?: string;
  orderType: string;
  status: string;
  customerDetails?: {
    name: string;
    phone: string;
  };
  kots?: {
    _id: string;
    items?: {
      _id: string;
      itemStatus: string;
      quantity?: number;
      menuItemId?: { name: string };
      isComplimentary?: boolean;
    }[];
  }[];
}
