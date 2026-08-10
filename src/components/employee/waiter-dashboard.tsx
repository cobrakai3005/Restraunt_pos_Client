"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, Minus, ShoppingBag, Search, Store, Loader2 } from "lucide-react";
import { User } from "@/services/auth.service";
import { employeeService } from "@/services/employee.service";
import { connectSocket, disconnectSocket } from "@/lib/socket";

interface DashboardProps {
  user: User;
}

interface Menu {
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
  }[];
  station: string;
  isAvailable: boolean;
  image?: string;
}

interface Table {
  _id: string;
  tableNumber: string;
  capacity: number;
  status: string;
}

interface CartItem extends Menu {
  cartId: string;
  quantity: number;
  notes: string;
  selectedVariant: {
    name: string;
    price: number;
  };
}

interface Order {
  _id: string;
  orderNumber?: number;
  tableId?: {
    _id: string;
    tableNumber: string;
  };
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
    }[];
  }[];
}

export function WaiterDashboard({ user }: DashboardProps) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  
  const [activeCategoryId, setActiveCategoryId] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" >("DINE_IN");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const activeOrdersRef = useRef<Order[]>([]);
  const toastedItemsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  
  const fetchActiveOrders = useCallback(async () => {
    try {
      const res = await employeeService.getOrders({ status: "OPEN" });
      const newOrders = res.data || [];
      
      newOrders.forEach((newOrder: any) => {
        newOrder.kots?.forEach((newKot: any) => {
          newKot.items?.forEach((newItem: any) => {
            if (newItem.itemStatus === "READY") {
              if (!isFirstLoadRef.current && !toastedItemsRef.current.has(newItem._id)) {
                toast({
                  title: "Food Ready! 🔔",
                  description: `${newItem.menuItemId?.name || "An item"} is ready for ${newOrder.orderType === 'DINE_IN' ? 'Table ' + newOrder.tableId?.tableNumber : newOrder.orderType}`,
                  duration: 8000,
                  className: "bg-green-50 border-green-500 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
                });
              }
              toastedItemsRef.current.add(newItem._id);
            }
          });
        });
      });

      isFirstLoadRef.current = false;
      setActiveOrders(newOrders);
      activeOrdersRef.current = newOrders;
    } catch (error) {
      console.error("Failed to fetch active orders", error);
    }
  }, [toast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menRes, tabRes, catRes] = await Promise.all([
          employeeService.getMenuItems(),
          employeeService.getTables(),
          employeeService.getCategories()
        ]);
        
        // Filter out inactive/soft-deleted items
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
      socket.on("table_status_change", fetchActiveOrders);
      socket.on("item_status_update", fetchActiveOrders);
      socket.on("order_billed", fetchActiveOrders);
      socket.on("new_kot", fetchActiveOrders);
    }

    return () => {
      if (socket) {
        socket.off("table_status_change", fetchActiveOrders);
        socket.off("item_status_update", fetchActiveOrders);
        socket.off("order_billed", fetchActiveOrders);
        socket.off("new_kot", fetchActiveOrders);
      }
      disconnectSocket();
    };
  }, [toast, fetchActiveOrders]);

  const addToCart = (menu: Menu) => {
    if (!menu.isAvailable) {
      toast({ variant: "destructive", title: "Item Unavailable", description: "This item is currently marked as unavailable." });
      return;
    }

    const defaultVariant = menu.variants?.[0] || { name: "Standard", price: 0 };

    setCart(prev => {
      const existing = prev.find(item => item._id === menu._id && !item.notes && item.selectedVariant.name === defaultVariant.name);
      if (existing) {
        return prev.map(item => item._id === menu._id && !item.notes && item.selectedVariant.name === defaultVariant.name ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...menu, cartId: Math.random().toString(), quantity: 1, notes: "", selectedVariant: defaultVariant }];
    });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateNotes = (cartId: string, notes: string) => {
    setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, notes } : item));
  };

  const filteredMenus = menus.filter(m => {
    const matchesCategory = activeCategoryId === "All" || m.categoryId?._id === activeCategoryId;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.selectedVariant.price * item.quantity), 0);
  const taxes = subtotal * 0.05; // Assuming 5% tax for now, ideally comes from backend
  const total = subtotal + taxes;

  const placeOrder = async () => {
    if (cart.length === 0) return toast({ variant: "destructive", title: "Cart is empty" });
    if (orderType === "DINE_IN" && !selectedTable) return toast({ variant: "destructive", title: "Select a table" });

    setIsSubmitting(true);
    try {
      const kotPayload = {
        station: "MAIN_KITCHEN",
        items: cart.map(c => ({ 
          menuItemId: c._id, 
          variantName: c.selectedVariant.name,
          quantity: c.quantity, 
          notes: c.notes || undefined
        }))
      };

      const existingOrder = orderType === "DINE_IN" 
        ? activeOrders.find(o => o.tableId?._id === selectedTable && o.status === "OPEN")
        : null;

      if (existingOrder) {
        // Append KOT to existing order
        await employeeService.addKot(existingOrder._id, kotPayload);
        toast({ title: "Additional KOT sent to kitchen successfully!" });
      } else {
        // 1. Create the Order envelope
        const orderPayload = {
          tableId: selectedTable || undefined,
          orderType,
          customerDetails: customerName || customerPhone ? { name: customerName, phone: customerPhone } : undefined
        };
        
        const orderRes = await employeeService.createOrder(orderPayload);
        const orderId = orderRes.data._id;

        // 2. Add the KOT (Kitchen Order Ticket)
        await employeeService.addKot(orderId, kotPayload);
        toast({ title: "New order sent to kitchen successfully!" });
      }

      setCart([]);
      if (!existingOrder) {
        setCustomerName("");
        setCustomerPhone("");
        setSelectedTable("");
      }
      fetchActiveOrders(); // refresh active orders immediately
      
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error placing order", description: error.message || "Failed to place order." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const markItemServed = async (orderId: string, itemId: string) => {
    const key = `${orderId}_${itemId}`;
    setUpdating(prev => ({ ...prev, [key]: true }));
    setItemErrors(prev => ({ ...prev, [key]: "" }));
    try {
      await employeeService.updateKotItemStatus(orderId, itemId, "SERVED");
      fetchActiveOrders();
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Failed to update status";
      setItemErrors(prev => ({ ...prev, [key]: message }));
      toast({ variant: "destructive", title: "Failed to update status", description: message });
    } finally {
      setUpdating(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <p className="text-slate-600 dark:text-slate-400">Syncing terminal data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-120px)] bg-slate-100/50 dark:bg-slate-900/50 -mx-8 -my-8 rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 transition-colors backdrop-blur-xl shadow-2xl">
      
      {/* Active Tables Sidebar */}
      <div className="hidden md:flex flex-col w-[200px] lg:w-[220px] border-r border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 z-10 shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-colors backdrop-blur-xl">
        <div className="p-4 border-b border-white/30 dark:border-slate-800/50 shrink-0 h-[80px] flex items-center justify-between">
          <h2 className="font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-500" /> Tables
          </h2>
        </div>
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-2">
            {tables.map(t => {
              const order = activeOrders.find(o => o.tableId?._id === t._id && o.status === "OPEN");
              const isOccupied = !!order;
              let hasReady = false;
              if (order) {
                order.kots?.forEach(kot => {
                  kot.items?.forEach(item => {
                    if (item.itemStatus === "READY") hasReady = true;
                  });
                });
              }

              return (
                <div 
                  key={t._id} 
                  onClick={() => {
                    setSelectedTable(t._id);
                    setOrderType("DINE_IN");
                    if (order && order.customerDetails) {
                      setCustomerName(order.customerDetails.name || "");
                      setCustomerPhone(order.customerDetails.phone || "");
                    } else if (!order) {
                      setCustomerName("");
                      setCustomerPhone("");
                    }
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 active:scale-95 ${selectedTable === t._id ? 'border-blue-400 bg-blue-50/80 dark:bg-blue-500/20 shadow-md ring-1 ring-blue-400/50' : 'border-white/40 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-sm'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-sm ${selectedTable === t._id ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>{t.tableNumber}</span>
                    <div className="flex items-center gap-2">
                      {isOccupied && (
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                          #{String(order.orderNumber || "").slice(-4)}
                        </span>
                      )}
                      {hasReady ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)] animate-pulse ring-2 ring-green-500/30" title="Food Ready"></span>
                      ) : isOccupied ? (
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" title="Occupied"></span>
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" title="Empty"></span>
                      )}
                    </div>
                  </div>
                  <div className={`mt-1 text-xs font-medium ${selectedTable === t._id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {t.status === "AVAILABLE" ? "Available" : t.status} • {t.capacity} seats
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Left Menu Section */}
      <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-transparent">
        
        {/* Search & Categories */}
        <div className="space-y-4 shrink-0">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <Input 
              placeholder="Search menu items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/50 dark:border-slate-700/50 shadow-sm text-lg rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:ring-offset-0 transition-all hover:bg-white/90 dark:hover:bg-slate-900/90"
            />
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            <Button 
              variant={activeCategoryId === "All" ? "default" : "outline"}
              className={`rounded-xl whitespace-nowrap px-6 transition-all duration-200 ${activeCategoryId === "All" ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" : "bg-white/60 dark:bg-slate-900/60 border-white/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-800 shadow-sm"}`}
              onClick={() => setActiveCategoryId("All")}
            >
              All Items
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat._id} 
                variant={activeCategoryId === cat._id ? "default" : "outline"}
                className={`rounded-xl whitespace-nowrap px-6 transition-all duration-200 ${activeCategoryId === cat._id ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20" : "bg-white/60 dark:bg-slate-900/60 border-white/50 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-800 shadow-sm"}`}
                onClick={() => setActiveCategoryId(cat._id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 pb-10">
            {filteredMenus.map(menu => (
              <Card 
                key={menu._id} 
                className={`cursor-pointer transition-all duration-300 flex flex-col h-36 active:scale-[0.97] bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-white/60 dark:border-slate-700/50 hover:shadow-xl hover:-translate-y-1 hover:border-blue-400/50 dark:hover:border-blue-500/50 hover:bg-white/90 dark:hover:bg-slate-800/90 shadow-sm ${!menu.isAvailable ? 'opacity-50 grayscale hover:-translate-y-0 hover:shadow-sm cursor-not-allowed' : ''}`}
                onClick={() => addToCart(menu)}
              >
                <CardContent className="p-4 flex flex-col h-full justify-between relative overflow-hidden">
                  {!menu.isAvailable && (
                    <div className="absolute inset-0 bg-slate-100/60 dark:bg-slate-950/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                      <span className="bg-red-500 text-white text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">Sold Out</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-sm line-clamp-2 leading-tight text-slate-900 dark:text-white drop-shadow-sm">{menu.name}</h3>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1 inline-block">{menu.categoryId?.name || "Uncategorized"}</span>
                  </div>
                  <div className="font-extrabold text-blue-600 dark:text-blue-400 mt-2 text-lg drop-shadow-sm">
                    ₹{(menu.variants?.[0]?.price || 0).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredMenus.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-500">
                No menu items found.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Cart Section */}
      <div className="w-full md:w-[350px] lg:w-[400px] border-l border-white/30 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl flex flex-col z-20 shrink-0 shadow-[-8px_0_30px_-15px_rgba(0,0,0,0.1)] transition-colors overflow-y-auto hide-scrollbar">
        <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 space-y-4 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl border border-white/50 dark:border-slate-800/50 shadow-inner">
            <Button size="sm" variant={orderType === "DINE_IN" ? "default" : "ghost"} onClick={() => setOrderType("DINE_IN")} className={`rounded-lg transition-all ${orderType === "DINE_IN" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"}`}>
              Dine In
            </Button>
            <Button size="sm" variant={orderType === "TAKEAWAY" ? "default" : "ghost"} onClick={() => setOrderType("TAKEAWAY")} className={`rounded-lg transition-all ${orderType === "TAKEAWAY" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md font-bold" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"}`}>
              Takeaway
            </Button>

          </div>
          
          {orderType === "DINE_IN" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-widest pl-1">Select Table</Label>
              <Select value={selectedTable} onValueChange={(val) => {
                setSelectedTable(val);
                const order = activeOrders.find(o => o.tableId?._id === val && o.status === "OPEN");
                if (order && order.customerDetails) {
                  setCustomerName(order.customerDetails.name || "");
                  setCustomerPhone(order.customerDetails.phone || "");
                } else {
                  setCustomerName("");
                  setCustomerPhone("");
                }
              }}>
                <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white h-12 rounded-xl focus:ring-blue-500/50">
                  <SelectValue placeholder="Choose table" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl shadow-xl">
                  {tables.map(t => (
                    <SelectItem key={t._id} value={t._id} className="focus:bg-slate-100 dark:focus:bg-slate-800 rounded-lg cursor-pointer">
                      {t.tableNumber} <span className="text-slate-400 dark:text-slate-500 text-xs ml-2 font-medium">({t.status})</span>
                    </SelectItem>
                  ))}
                  {tables.length === 0 && <SelectItem value="none" disabled>No tables available</SelectItem>}
                </SelectContent>
              </Select>
              {activeOrders.some(o => o.tableId?._id === selectedTable && o.status === "OPEN") && (
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium bg-amber-100/50 dark:bg-amber-900/20 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50 shadow-inner mt-2">
                  This table currently has an active order. New items will be appended as a new KOT.
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <Label className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-extrabold tracking-widest pl-1">Customer Details <span className="opacity-50 font-medium lowercase">(optional)</span></Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Name" 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)} 
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white h-11 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500/50"
              />
              <Input 
                placeholder="Phone" 
                value={customerPhone} 
                onChange={e => setCustomerPhone(e.target.value)} 
                className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white h-11 w-32 rounded-xl placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 shrink-0">
          {(() => {
            const existingOrder = activeOrders.find(o => o.tableId?._id === selectedTable && o.status === "OPEN");
            const hasExistingItems = existingOrder && existingOrder.kots && existingOrder.kots.length > 0;

            return (
              <div className="space-y-5">
                {hasExistingItems && (
                  <div className="space-y-3 bg-white/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 p-4 rounded-2xl shadow-sm backdrop-blur-md">
                    <h3 className="font-extrabold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Already Ordered</h3>
                    <div className="space-y-1">
                      {existingOrder.kots?.flatMap(kot => 
                        kot.items?.map((item: any) => (
                          <div key={item._id} className="flex justify-between items-center py-2.5 border-b border-slate-200/50 dark:border-slate-800/50 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm bg-slate-100 dark:bg-slate-800 w-6 h-6 flex items-center justify-center rounded-md">{item.quantity}</span>
                              <span className="font-semibold text-slate-900 dark:text-white text-sm">{item.menuItemId?.name || "Item"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.itemStatus === 'READY' ? (
                                <div className="flex flex-col items-end gap-1">
                                  <button
                                    onClick={() => markItemServed(existingOrder._id, item._id)}
                                    disabled={!!updating[`${existingOrder._id}_${item._id}`]}
                                    className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase bg-green-500 text-white hover:bg-green-400 shadow-[0_0_12px_rgba(34,197,94,0.4)] hover:shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-all cursor-pointer active:scale-95 animate-pulse ${updating[`${existingOrder._id}_${item._id}`] ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    title="Click to mark as Picked Up/Served"
                                  >
                                    {updating[`${existingOrder._id}_${item._id}`] ? (
                                      <Loader2 className="h-3 w-3 inline animate-spin" />
                                    ) : "PICK UP"}
                                  </button>
                                  {itemErrors[`${existingOrder._id}_${item._id}`] && (
                                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                                      {itemErrors[`${existingOrder._id}_${item._id}`]}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                  item.itemStatus === 'SERVED' ? 'bg-slate-200/50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400' :
                                  item.itemStatus === 'PREPARING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                }`}>
                                  {item.itemStatus}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {hasExistingItems && cart.length > 0 && (
                  <div className="border-t-2 border-dashed border-slate-200 dark:border-slate-700 my-2 pt-4">
                    <h3 className="font-extrabold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 mb-2">New Items</h3>
                  </div>
                )}

                {cart.length === 0 ? (
                  !hasExistingItems && (
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4 py-12">
                      <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
                        <ShoppingBag className="h-10 w-10 opacity-50" />
                      </div>
                      <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Cart is empty</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.cartId} className="flex flex-col gap-3 p-3.5 border rounded-2xl bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-sm leading-tight pr-4 text-slate-900 dark:text-white">
                            {item.name} <span className="text-[11px] text-slate-500 font-semibold ml-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">({item.selectedVariant.name})</span>
                          </div>
                          <div className="font-extrabold text-sm text-blue-600 dark:text-blue-400">₹{(item.selectedVariant.price * item.quantity).toFixed(2)}</div>
                        </div>
                        
                        <Input 
                          placeholder="Add cooking notes (e.g. no onions)" 
                          value={item.notes}
                          onChange={(e) => updateNotes(item.cartId, e.target.value)}
                          className="h-8 text-xs bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-lg focus-visible:ring-blue-500/30"
                        />

                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all" onClick={() => updateQuantity(item.cartId, -1)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all" onClick={() => updateQuantity(item.cartId, 1)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" onClick={() => removeFromCart(item.cartId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-950/50 space-y-4 shrink-0 mt-auto backdrop-blur-md">
          <div className="space-y-2 text-sm font-medium">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="text-slate-700 dark:text-slate-300">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Taxes (5%)</span>
              <span className="text-slate-700 dark:text-slate-300">₹{taxes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-xl pt-3 border-t border-slate-200/50 dark:border-slate-800/50 mt-2 text-slate-900 dark:text-white">
              <span>Total</span>
              <span className="text-blue-600 dark:text-blue-400">₹{total.toFixed(2)}</span>
            </div>
          </div>
          <Button 
            className="w-full h-14 text-lg font-extrabold tracking-wide shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:bg-[rgba(37,99,235,0.9)] bg-blue-600 text-white rounded-xl active:scale-[0.98] transition-all duration-200" 
            disabled={cart.length === 0 || isSubmitting}
            onClick={placeOrder}
          >
            {isSubmitting ? "Firing Order..." : "FIRE TO KITCHEN"}
          </Button>
        </div>
      </div>
    </div>
  );
}
