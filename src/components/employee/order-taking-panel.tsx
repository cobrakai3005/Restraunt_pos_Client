"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { employeeService } from "@/services/employee.service";
import { customerService, Customer } from "@/services/customer.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { VariantPickerDialog, SelectedModifier } from "./variant-picker-dialog";
import { ReceiptModal } from "./ReceiptModal";
import { MergeTablesDialog } from "./merge-tables-dialog";
import { UnmergeTablesDialog } from "./unmerge-tables-dialog";
import { Menu, Table, CartItem, Order, PRESET_COOKING_NOTES } from "./order-taking/types";
import { TableFloorSidebar } from "./order-taking/table-floor-sidebar";
import { CategorySidebar } from "./order-taking/category-sidebar";
import { MenuCatalogSection } from "./order-taking/menu-catalog-section";
import { FloatingActionButtons } from "./order-taking/floating-action-buttons";
import { CartDrawer } from "./order-taking/cart-drawer";

interface OrderTakingPanelProps {
  onOrderFired?: () => void;
}

export function OrderTakingPanel({ onOrderFired }: OrderTakingPanelProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Debounce search query to prevent lag on fast typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);

  // Debounced phone search for customer tagging
  useEffect(() => {
    if (!customerPhone || customerPhone.trim().length < 4) {
      setMatchedCustomer(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await customerService.searchCustomerByPhone(customerPhone.trim());
        if (res?.data) {
          setMatchedCustomer(res.data);
          if (!customerName.trim()) {
            setCustomerName(res.data.name);
          }
        } else {
          setMatchedCustomer(null);
        }
      } catch {
        setMatchedCustomer(null);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [customerPhone, customerName]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickReceiptSubmitting, setIsQuickReceiptSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerMenu, setPickerMenu] = useState<Menu | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [showUnmergeDialog, setShowUnmergeDialog] = useState(false);
  const [unmergeTargetOrder, setUnmergeTargetOrder] = useState<any | null>(null);
  const [unmergeTargetTableId, setUnmergeTargetTableId] = useState<string>("");
  const { toast } = useToast();

  const isFirstLoadRef = useRef(true);
  const toastedItemsRef = useRef<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Debounce timer for auto-punch: waits for the user to stop typing before matching shortcode
  const autoPunchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // When a shortcode punch opens the variant picker (e.g. "3*cc"), stores the qty multiplier
  // so the picker's onConfirm can add the correct quantity to the cart.
  const pickerQtyRef = useRef<number>(1);

  // UX: cart flash animation — pulses the FAB when a new item is added
  const [cartFlash, setCartFlash] = useState(false);
  // UX: cart drawer open/close
  const [cartOpen, setCartOpen] = useState(false);
  // UX: recently added strip — last 4 unique items added to cart for quick re-add
  const [recentlyAdded, setRecentlyAdded] = useState<Menu[]>([]);

  // Close cart drawer on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus search input on '/' shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchActiveOrders = useCallback(async () => {
    try {
      const [resOpen, resBilled] = await Promise.all([
        employeeService.getOrders({ status: "OPEN" }),
        employeeService.getOrders({ status: "BILLED" }),
      ]);
      const newOrders = [...(resOpen.data || []), ...(resBilled.data || [])];

      newOrders.forEach((newOrder: any) => {
        newOrder.kots?.forEach((newKot: any) => {
          newKot.items?.forEach((newItem: any) => {
            if (newItem.itemStatus === "READY") {
              if (!isFirstLoadRef.current && !toastedItemsRef.current.has(newItem._id)) {
                toast({
                  title: "Food Ready! 🔔",
                  description: `${newItem.menuItemId?.name || "An item"} is ready for ${
                    newOrder.orderType === "DINE_IN"
                      ? "Table " + newOrder.tableId?.tableNumber
                      : newOrder.orderType
                  }`,
                  duration: 8000,
                  className:
                    "bg-green-50 border-green-500 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
                });
              }
              toastedItemsRef.current.add(newItem._id);
            }
          });
        });
      });

      isFirstLoadRef.current = false;
      setActiveOrders(newOrders);
    } catch (error) {
      console.error("Failed to fetch active orders", error);
    }
  }, [toast]);

  const refreshFloorAndOrders = useCallback(async () => {
    fetchActiveOrders();
    try {
      const tabRes = await employeeService.getTables();
      setTables(tabRes.data?.tables || []);
    } catch {
      // ignore
    }
  }, [fetchActiveOrders]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menRes, tabRes, catRes] = await Promise.all([
          employeeService.getMenuItems(),
          employeeService.getTables(),
          employeeService.getCategories(),
        ]);

        setMenus(menRes.data?.menuItems?.filter((m: any) => m.isActive) || []);
        setTables(tabRes.data?.tables || []);
        setCategories(catRes.data?.categories?.filter((c: any) => c.isActive) || []);
      } catch (error: any) {
        toast({ variant: "destructive", title: "Failed to load POS data", description: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
    fetchActiveOrders();

    const socket = connectSocket();
    if (socket) {
      socket.on("table_status_change", refreshFloorAndOrders);
      socket.on("tables_merged", refreshFloorAndOrders);
      socket.on("tables_unmerged", refreshFloorAndOrders);
      socket.on("item_status_update", fetchActiveOrders);
      socket.on("order_billed", fetchActiveOrders);
      socket.on("new_kot", fetchActiveOrders);
    }

    return () => {
      if (socket) {
        socket.off("table_status_change", refreshFloorAndOrders);
        socket.off("tables_merged", refreshFloorAndOrders);
        socket.off("tables_unmerged", refreshFloorAndOrders);
        socket.off("item_status_update", fetchActiveOrders);
        socket.off("order_billed", fetchActiveOrders);
        socket.off("new_kot", fetchActiveOrders);
      }
    };
  }, [toast, fetchActiveOrders, refreshFloorAndOrders]);

  const addToCart = (
    menu: Menu,
    chosenVariant?: { name: string; price: number },
    selectedModifiers: SelectedModifier[] = [],
    itemNotes: string = "",
    addedQty: number = 1
  ) => {
    if (!menu.isAvailable) {
      toast({
        variant: "destructive",
        title: "Item Unavailable",
        description: "This item is currently marked as unavailable.",
      });
      return;
    }

    const selectedVariant = chosenVariant || menu.variants?.[0] || { name: "Standard", price: 0 };
    const modifiersKey = (selectedModifiers || [])
      .map((m) => `${m.groupName}:${m.name}`)
      .sort()
      .join("|");
    const cartId = `${menu._id}_${selectedVariant.name}_${modifiersKey}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartId === cartId);
      if (existing) {
        return prev.map((item) =>
          item.cartId === cartId ? { ...item, quantity: item.quantity + addedQty } : item
        );
      }
      return [
        ...prev,
        {
          ...menu,
          cartId,
          quantity: addedQty,
          notes: itemNotes,
          selectedVariant,
          selectedModifiers,
        },
      ];
    });

    setRecentlyAdded((prev) => {
      const filtered = prev.filter((m) => m._id !== menu._id);
      return [menu, ...filtered].slice(0, 4);
    });

    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 400);

    toast({
      title: `Added to Cart 🛒`,
      description: `${addedQty > 1 ? `${addedQty}x ` : ""}${menu.name} (${selectedVariant.name})`,
      duration: 1500,
    });
  };

  const handleMenuClick = (menu: Menu) => {
    const hasMultipleVariants = menu.variants && menu.variants.length > 1;
    const hasModifiers = menu.modifierGroups && menu.modifierGroups.length > 0;
    if (hasMultipleVariants || hasModifiers) {
      setPickerMenu(menu);
    } else {
      addToCart(menu);
    }
  };

  const tryAutoPunch = (rawInput: string): boolean => {
    const trimmed = rawInput.trim();
    if (!trimmed) return false;

    let qty = 1;
    let codeStr = trimmed;

    const multMatch = trimmed.match(/^(\d+)\s*[*xX]\s*(.+)$/);
    if (multMatch) {
      qty = parseInt(multMatch[1], 10) || 1;
      codeStr = multMatch[2].trim();
    }

    if (!codeStr) return false;

    const exactMatch = menus.find((m) => {
      if (!m.isAvailable) return false;
      const matchShort =
        m.shortCode && m.shortCode.trim().toLowerCase() === codeStr.toLowerCase();
      const matchNum =
        m.numericCode && m.numericCode.trim().toLowerCase() === codeStr.toLowerCase();
      return matchShort || matchNum;
    });

    if (exactMatch) {
      const hasMultipleVariants = exactMatch.variants && exactMatch.variants.length > 1;
      const hasModifiers = exactMatch.modifierGroups && exactMatch.modifierGroups.length > 0;

      if (hasMultipleVariants || hasModifiers) {
        // Open variant/modifier picker — store qty so the confirm callback can use it
        pickerQtyRef.current = qty;
        setPickerMenu(exactMatch);
      } else {
        // Single variant, no modifiers — add directly with qty
        addToCart(exactMatch, undefined, [], "", qty);
      }
      return true;
    }

    return false;
  };

  const handleQuickPunch = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (tryAutoPunch(trimmed)) return;

    let qty = 1;
    let term = trimmed;
    const multMatch = trimmed.match(/^(\d+)\s*[*xX]\s*(.+)$/);
    if (multMatch) {
      qty = parseInt(multMatch[1], 10) || 1;
      term = multMatch[2].trim();
    }

    const matched = menus.find(
      (m) =>
        m.isAvailable &&
        (m.name.toLowerCase().includes(term.toLowerCase()) ||
          (m.shortCode && m.shortCode.toLowerCase().includes(term.toLowerCase())) ||
          (m.numericCode && m.numericCode.toLowerCase().includes(term.toLowerCase())))
    );

    if (matched) {
      addToCart(matched, undefined, [], "", qty);
      setSearchQuery("");
      setDebouncedSearchQuery("");
    } else {
      toast({
        variant: "destructive",
        title: "No Match Found",
        description: `Could not find an available dish matching "${trimmed}".`,
      });
    }
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateNotes = (cartId: string, notes: string) => {
    setCart((prev) =>
      prev.map((item) => (item.cartId === cartId ? { ...item, notes } : item))
    );
  };

  const togglePresetNote = (cartId: string, preset: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartId !== cartId) return item;
        const current = item.notes ? item.notes.trim() : "";
        const parts = current ? current.split(",").map((s) => s.trim()) : [];
        let updated: string[];
        if (parts.includes(preset)) {
          updated = parts.filter((p) => p !== preset);
        } else {
          updated = [...parts, preset];
        }
        return { ...item, notes: updated.join(", ") };
      })
    );
  };

  const removeFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const getItemUnitPrice = (item: CartItem): number => {
    const variantP = item.selectedVariant?.price || 0;
    const modifiersP = (item.selectedModifiers || []).reduce(
      (sum, m) => sum + (Number(m.price) || 0),
      0
    );
    return variantP + modifiersP;
  };

  const subtotal = cart.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);

  const calculateTotalTaxes = () => {
    return cart.reduce((sum, item) => {
      const itemSubtotal = getItemUnitPrice(item) * item.quantity;
      const rate = ((item.variants?.[0] as any)?.taxPercentage ?? 5) / 100;
      return sum + itemSubtotal * rate;
    }, 0);
  };

  const taxes = calculateTotalTaxes();
  const total = subtotal + taxes;
  const effectiveTaxPct = subtotal > 0 ? ((taxes / subtotal) * 100).toFixed(0) : "5";

  const categoryCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const menu of menus) {
      if (menu.isAvailable) {
        const catId = menu.categoryId?._id;
        if (catId) {
          map.set(catId, (map.get(catId) || 0) + 1);
        }
      }
    }
    return map;
  }, [menus]);

  const filteredMenus = useMemo(() => {
    let result = menus;
    if (activeCategoryId !== "All") {
      result = result.filter((m) => m.categoryId?._id === activeCategoryId);
    }
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.shortCode?.toLowerCase().includes(query) ||
          m.numericCode?.toLowerCase().includes(query) ||
          m.categoryId?.name.toLowerCase().includes(query)
      );
    }
    return result;
  }, [menus, activeCategoryId, debouncedSearchQuery]);

  const placeOrder = async (): Promise<any> => {
    if (cart.length === 0) return null;
    if (orderType === "DINE_IN" && !selectedTable) {
      toast({
        variant: "destructive",
        title: "Table Required",
        description: "Please select a table from the floor layout.",
      });
      return null;
    }

    setIsSubmitting(true);
    try {
      let orderId: string | null = null;

      // Check if table already has an active OPEN order (including merged primary order)
      const existingOrder = activeOrders.find((o) => {
        if (!o || o.status !== "OPEN") return false;
        const tId = typeof o.tableId === "object" ? o.tableId?._id : o.tableId;
        const linkedIds = Array.isArray(o.tableIds)
          ? o.tableIds.map((t: any) => (typeof t === "object" ? t._id : t))
          : [];
        return String(tId) === String(selectedTable) || linkedIds.includes(String(selectedTable));
      });

      if (existingOrder) {
        orderId = existingOrder._id;

        // Reusing an open table order must also persist the customer selected
        // in the order-taking panel. Otherwise the cashier only receives the
        // old customer name and has no phone/customer id to restore.
        if (matchedCustomer || customerName.trim() || customerPhone.trim()) {
          await employeeService.updateCustomer(orderId, {
            name: matchedCustomer?.name || customerName.trim() || "Walk-in",
            phone: matchedCustomer?.phone || customerPhone.trim() || "",
            customerId: matchedCustomer?._id || null,
          });
        }
      } else {
        const payload: any = {
          orderType,
          guestCount: Math.max(1, guestCount),
        };

        if (orderType === "DINE_IN") {
          payload.tableId = selectedTable;
        }

        if (customerName.trim() || customerPhone.trim()) {
          payload.customerDetails = {
            name: customerName.trim() || "Walk-in",
            phone: customerPhone.trim() || "",
            customerId: matchedCustomer?._id || null,
          };
        }

        const createRes = await employeeService.createOrder(payload);
        const createdData = createRes.data || createRes;
        orderId = createdData._id || createdData.id || createdData.order?._id;
      }

      if (!orderId) {
        throw new Error("Could not initialize order for this table.");
      }

      // Add KOT to the order
      const kotPayload = {
        station: cart[0]?.station || "KITCHEN",
        items: cart.map((item) => ({
          menuItemId: item._id,
          variantName: item.selectedVariant.name,
          quantity: item.quantity,
          notes: item.notes || "",
          selectedModifiers: (item.selectedModifiers || []).map((m) => ({
            name: m.name,
            price: m.price,
            groupName: m.groupName,
          })),
        })),
      };

      const kotRes = await employeeService.addKot(orderId, kotPayload);

      toast({
        title: "Order Fired! 🔥",
        description: `Successfully fired to kitchen stations${
          orderType === "DINE_IN"
            ? ` for Table ${tables.find((t) => t._id === selectedTable)?.tableNumber || selectedTable}`
            : ""
        }.`,
        className: "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100",
      });

      setCart([]);
      setRecentlyAdded([]);
      await fetchActiveOrders();
      onOrderFired?.();
      return kotRes?.data || kotRes;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.response?.data?.message || error.message || "Failed to fire order.",
      });
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickReceipt = async () => {
    if (cart.length === 0) return;
    setIsQuickReceiptSubmitting(true);
    try {
      // ── Step 1: Create order + fire KOT ──
      if (orderType === "DINE_IN" && !selectedTable) {
        toast({ variant: "destructive", title: "Table Required", description: "Please select a table before using Quick Receipt." });
        return;
      }

      let orderId: string | null = null;

      // Reuse existing OPEN order for this table if one exists
      const existingOrder = activeOrders.find((o) => {
        if (!o || o.status !== "OPEN") return false;
        const tId = typeof o.tableId === "object" ? o.tableId?._id : o.tableId;
        const linkedIds = Array.isArray(o.tableIds)
          ? o.tableIds.map((t: any) => (typeof t === "object" ? t._id : t))
          : [];
        return String(tId) === String(selectedTable) || linkedIds.includes(String(selectedTable));
      });

      if (existingOrder) {
        orderId = existingOrder._id;

        // Keep customer details in sync when Quick Receipt reuses an existing
        // open table order.
        if (matchedCustomer || customerName.trim() || customerPhone.trim()) {
          await employeeService.updateCustomer(orderId, {
            name: matchedCustomer?.name || customerName.trim() || "Walk-in",
            phone: matchedCustomer?.phone || customerPhone.trim() || "",
            customerId: matchedCustomer?._id || null,
          });
        }
      } else {
        const payload: any = { orderType, guestCount: Math.max(1, guestCount) };
        if (orderType === "DINE_IN") payload.tableId = selectedTable;
        if (customerName.trim() || customerPhone.trim()) {
          payload.customerDetails = {
            name: customerName.trim() || "Walk-in",
            phone: customerPhone.trim() || "",
            customerId: matchedCustomer?._id || null,
          };
        }
        const createRes = await employeeService.createOrder(payload);
        const createdData = createRes.data || createRes;
        orderId = createdData._id || createdData.id || createdData.order?._id;
      }

      if (!orderId) throw new Error("Could not initialize order.");

      // Add KOT (fires to kitchen display — fine if it shows there)
      const kotPayload = {
        station: cart[0]?.station || "KITCHEN",
        items: cart.map((item) => ({
          menuItemId: item._id,
          variantName: item.selectedVariant.name,
          quantity: item.quantity,
          notes: item.notes || "",
          selectedModifiers: (item.selectedModifiers || []).map((m) => ({
            name: m.name,
            price: m.price,
            groupName: m.groupName,
          })),
        })),
      };
      await employeeService.addKot(orderId, kotPayload);

      // ── Step 2: Generate bill → lock totals, status becomes BILLED ──
      const billedOrder = await employeeService.generateBill(orderId);
      const grandTotal =
        billedOrder?.financials?.grandTotal ??
        billedOrder?.data?.financials?.grandTotal ??
        0;

      // ── Step 3: Checkout with CASH → status PAID, SALES transaction created ──
      const checkoutResult = await employeeService.checkoutOrder(orderId, {
        payments: [{ method: "CASH", amount: grandTotal }],
      });

      const paidOrder =
        checkoutResult?.order ??
        checkoutResult?.data?.order ??
        billedOrder;

      // ── Step 4: Clear cart, refresh orders, show receipt ──
      setCart([]);
      setRecentlyAdded([]);
      await fetchActiveOrders();
      onOrderFired?.();

      toast({
        title: "Quick Receipt ⚡🧾",
        description: `₹${grandTotal.toFixed(0)} collected. Order marked PAID.`,
        className: "bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100",
      });

      setReceiptOrder(paidOrder);
      setShowReceiptModal(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Quick Receipt Failed",
        description: err?.response?.data?.message || err.message || "Something went wrong.",
      });
    } finally {
      setIsQuickReceiptSubmitting(false);
    }
  };

  const handleResetAll = () => {
    setCart([]);
    setSelectedTable("");
    setCustomerName("");
    setCustomerPhone("");
    setSearchQuery("");
    setOrderType("DINE_IN");
    toast({
      title: "Order Reset 🧹",
      description: "Cart, selected table, and customer details cleared.",
    });
  };

  const handleTableSelection = (tableId: string) => {
    const t = tables.find((tab) => tab._id === tableId);
    const isMergedSecondary = t?.status === "MERGED" || Boolean(t?.mergedIntoTableId);
    const parentTableId = isMergedSecondary
      ? typeof t?.mergedIntoTableId === "object"
        ? t?.mergedIntoTableId?._id
        : t?.mergedIntoTableId
      : null;
    const parentTable = parentTableId ? tables.find((pt) => String(pt._id) === String(parentTableId)) : null;

    if (isMergedSecondary && parentTableId) {
      setSelectedTable(parentTableId);
      setOrderType("DINE_IN");
      toast({
        title: `🔗 Table ${t?.tableNumber} is Merged`,
        description: `Switched to Primary Table ${parentTable?.tableNumber || ""}.`,
      });
      return;
    }

    setSelectedTable(tableId);
    setOrderType("DINE_IN");
    const order = activeOrders.find(
      (o) =>
        (o.tableId?._id === tableId || (o as any).tableId === tableId) &&
        o.status === "OPEN"
    );

    if (order) {
      if (order.guestCount) {
        setGuestCount(order.guestCount);
      }
      if (order.customerDetails) {
        setCustomerName(order.customerDetails.name || "");
        setCustomerPhone(order.customerDetails.phone || "");
      }
    } else {
      setGuestCount(t?.capacity || 2);
      setCustomerName("");
      setCustomerPhone("");
    }
  };

  if (isLoading) {
    return (
      <div
        className="relative flex h-full min-h-[420px] overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950 shadow-xl"
        role="status"
        aria-label="Preparing order terminal"
      >
        {/* Table floor */}
        <aside className="hidden md:flex w-52 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-950 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className={`h-16 rounded-xl border animate-pulse ${
                  index === 2 || index === 7
                    ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
                    : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/70"
                }`}
              />
            ))}
          </div>
        </aside>

        {/* Categories */}
        <aside className="hidden lg:flex w-24 shrink-0 flex-col items-center gap-3 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 py-4 px-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="w-full flex flex-col items-center gap-1.5">
              <div className={`h-10 w-10 rounded-xl animate-pulse ${index === 0 ? "bg-blue-100 dark:bg-blue-950" : "bg-slate-100 dark:bg-slate-800"}`} />
              <div className="h-2 w-12 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ))}
        </aside>

        {/* Menu catalog */}
        <main className="min-w-0 flex-1 p-3 md:p-5">
          <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="h-11 flex-1 max-w-xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-24 rounded-xl bg-blue-100 dark:bg-blue-950/60 animate-pulse" />
              <div className="h-10 w-20 rounded-xl bg-white dark:bg-slate-900 animate-pulse" />
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-36 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-2.5 w-52 rounded-full bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-white dark:bg-slate-900 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {Array.from({ length: 15 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className={`h-20 sm:h-24 animate-pulse ${index % 4 === 0 ? "bg-orange-100 dark:bg-orange-950/40" : "bg-slate-100 dark:bg-slate-800"}`} />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-4/5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-12 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-950 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-4 py-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 shadow-lg backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Syncing live menu and floor data
        </div>
        <span className="sr-only">Syncing terminal data</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col md:flex-row h-full bg-slate-100/50 dark:bg-slate-900/50 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 transition-colors backdrop-blur-xl shadow-2xl">
      {/* 1. Left Table Floor Sidebar */}
      <TableFloorSidebar
        tables={tables}
        activeOrders={activeOrders}
        selectedTable={selectedTable}
        onSelectTable={handleTableSelection}
        onOpenMergeDialog={() => setShowMergeDialog(true)}
        onUnmergeOrder={(order, tableId) => {
          setUnmergeTargetOrder(order);
          setUnmergeTargetTableId(tableId || "");
          setShowUnmergeDialog(true);
        }}
      />

      {/* 2. Vertical Category Sidebar */}
      <CategorySidebar
        categories={categories}
        menus={menus}
        activeCategoryId={activeCategoryId}
        onSelectCategory={setActiveCategoryId}
        categoryCountMap={categoryCountMap}
      />

      {/* 3. Central Menu Catalog Grid */}
      <MenuCatalogSection
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          // Always update the visible search box immediately so the user sees what they're typing
          setSearchQuery(val);

          // Cancel any pending auto-punch from the previous keystroke
          if (autoPunchTimerRef.current) {
            clearTimeout(autoPunchTimerRef.current);
            autoPunchTimerRef.current = null;
          }

          if (!val.trim()) return;

          // Wait 600ms after the user STOPS typing before attempting an exact shortcode match.
          // This prevents 'cc' from firing when the user intends to type 'ccc'.
          autoPunchTimerRef.current = setTimeout(() => {
            autoPunchTimerRef.current = null;
            const punched = tryAutoPunch(val);
            if (punched) {
              setSearchQuery("");
              setDebouncedSearchQuery("");
            }
          }, 600);
        }}
        onSearchKeyDown={(e) => {
          if (e.key === "Enter" && searchQuery.trim()) {
            e.preventDefault();
            setDebouncedSearchQuery(searchQuery);
            handleQuickPunch(searchQuery);
          } else if (e.key === "Escape") {
            setSearchQuery("");
            setDebouncedSearchQuery("");
          }
        }}
        onClearSearch={() => {
          setSearchQuery("");
          setDebouncedSearchQuery("");
          searchInputRef.current?.focus();
        }}
        orderType={orderType}
        onSwitchOrderType={setOrderType}
        selectedTable={selectedTable}
        tables={tables}
        onUnselectTable={() => setSelectedTable("")}
        guestCount={guestCount}
        onUpdateGuestCount={(delta) => setGuestCount((g) => Math.max(1, g + delta))}
        recentlyAdded={recentlyAdded}
        onMenuClick={handleMenuClick}
        filteredMenus={filteredMenus}
        cart={cart}
      />

      {/* 4. Floating Action Buttons */}
      <FloatingActionButtons
        cart={cart}
        cartFlash={cartFlash}
        selectedTable={selectedTable}
        customerName={customerName}
        customerPhone={customerPhone}
        onResetAll={handleResetAll}
        onQuickReceipt={handleQuickReceipt}
        isQuickReceiptSubmitting={isQuickReceiptSubmitting}
        onPlaceOrder={async () => {
          await placeOrder();
        }}
        isSubmitting={isSubmitting}
        onOpenCart={() => setCartOpen(true)}
        total={total}
      />

      {/* 5. Cart Drawer */}
      <CartDrawer
        cartOpen={cartOpen}
        onCloseCart={() => setCartOpen(false)}
        cart={cart}
        selectedTable={selectedTable}
        onResetAll={handleResetAll}
        orderType={orderType}
        onSetOrderType={(type) => {
          setOrderType(type);
          if (type === "TAKEAWAY") setSelectedTable("");
        }}
        tables={tables}
        activeOrders={activeOrders}
        onSelectTable={handleTableSelection}
        guestCount={guestCount}
        onUpdateGuestCount={(delta) => setGuestCount((g) => Math.max(1, g + delta))}
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        customerPhone={customerPhone}
        onCustomerPhoneChange={setCustomerPhone}
        matchedCustomer={matchedCustomer}
        onClearCustomer={() => {
          setCustomerName("");
          setCustomerPhone("");
          setMatchedCustomer(null);
        }}
        getItemUnitPrice={getItemUnitPrice}
        updateNotes={updateNotes}
        togglePresetNote={togglePresetNote}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        subtotal={subtotal}
        taxes={taxes}
        effectiveTaxPct={effectiveTaxPct}
        total={total}
        isSubmitting={isSubmitting}
        isQuickReceiptSubmitting={isQuickReceiptSubmitting}
        onQuickReceipt={handleQuickReceipt}
        onPlaceOrder={placeOrder}
      />

      {/* 6. Modals */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        order={receiptOrder}
        tables={tables}
      />

      <MergeTablesDialog
        open={showMergeDialog}
        onOpenChange={setShowMergeDialog}
        tables={tables}
        activeOrders={activeOrders}
        preselectedTableId={selectedTable || undefined}
        onMergeSuccess={() => {
          refreshFloorAndOrders();
        }}
      />

      <UnmergeTablesDialog
        open={showUnmergeDialog}
        onOpenChange={setShowUnmergeDialog}
        primaryOrder={unmergeTargetOrder}
        tables={tables}
        preselectedUnmergeTableId={unmergeTargetTableId || undefined}
        onUnmergeSuccess={() => {
          refreshFloorAndOrders();
          setUnmergeTargetOrder(null);
          setUnmergeTargetTableId("");
        }}
      />

      <VariantPickerDialog
        open={!!pickerMenu}
        onOpenChange={(open) => {
          if (!open) {
            setPickerMenu(null);
            pickerQtyRef.current = 1; // reset after close
          }
        }}
        itemName={pickerMenu?.name || ""}
        itemImage={pickerMenu?.imageUrl || undefined}
        variants={pickerMenu?.variants || []}
        modifierGroups={pickerMenu?.modifierGroups || []}
        onSelect={(variant, selectedModifiers, notes) => {
          if (pickerMenu) {
            const qty = pickerQtyRef.current || 1;
            pickerQtyRef.current = 1; // reset after use
            addToCart(pickerMenu, variant, selectedModifiers || [], notes || "", qty);
          }
        }}
      />
    </div>
  );
}
