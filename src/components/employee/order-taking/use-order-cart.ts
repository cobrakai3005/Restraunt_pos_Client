"use client";

import { useMemo, useState } from "react";
import { SelectedModifier } from "../variant-picker-dialog";
import { CartItem, Menu } from "./types";

type Toast = (options: any) => void;

export function useOrderCart(toast: Toast) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartFlash, setCartFlash] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<Menu[]>([]);

  const addToCart = (
    menu: Menu,
    chosenVariant?: { name: string; price: number },
    selectedModifiers: SelectedModifier[] = [],
    itemNotes = "",
    addedQty = 1
  ) => {
    if (!menu.isAvailable) {
      toast({ variant: "destructive", title: "Item Unavailable", description: "This item is currently marked as unavailable." });
      return;
    }

    const selectedVariant = chosenVariant || menu.variants?.[0] || { name: "Standard", price: 0 };
    const modifiersKey = selectedModifiers.map((modifier) => `${modifier.groupName}:${modifier.name}`).sort().join("|");
    const cartId = `${menu._id}_${selectedVariant.name}_${modifiersKey}`;

    setCart((previous) => {
      const existing = previous.find((item) => item.cartId === cartId);
      if (existing) return previous.map((item) => item.cartId === cartId ? { ...item, quantity: item.quantity + addedQty } : item);
      return [...previous, { ...menu, cartId, quantity: addedQty, notes: itemNotes, selectedVariant, selectedModifiers }];
    });
    setRecentlyAdded((previous) => [menu, ...previous.filter((item) => item._id !== menu._id)].slice(0, 4));
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 400);
    toast({ title: "Added to Cart 🛒", description: `${addedQty > 1 ? `${addedQty}x ` : ""}${menu.name} (${selectedVariant.name})`, duration: 1500 });
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((previous) => previous.map((item) => {
      if (item.cartId !== cartId) return item;
      const quantity = item.quantity + delta;
      return quantity > 0 ? { ...item, quantity } : null;
    }).filter(Boolean) as CartItem[]);
  };

  const updateNotes = (cartId: string, notes: string) => setCart((previous) => previous.map((item) => item.cartId === cartId ? { ...item, notes } : item));

  const togglePresetNote = (cartId: string, preset: string) => {
    setCart((previous) => previous.map((item) => {
      if (item.cartId !== cartId) return item;
      const notes = item.notes ? item.notes.split(",").map((note) => note.trim()) : [];
      const updatedNotes = notes.includes(preset) ? notes.filter((note) => note !== preset) : [...notes, preset];
      return { ...item, notes: updatedNotes.join(", ") };
    }));
  };

  const removeFromCart = (cartId: string) => setCart((previous) => previous.filter((item) => item.cartId !== cartId));
  const getItemUnitPrice = (item: CartItem) => (item.selectedVariant?.price || 0) + (item.selectedModifiers || []).reduce((sum, modifier) => sum + (Number(modifier.price) || 0), 0);

  const { subtotal, taxes, total, effectiveTaxPct } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity, 0);
    const taxes = cart.reduce((sum, item) => sum + getItemUnitPrice(item) * item.quantity * (((item.variants?.[0] as any)?.taxPercentage ?? 5) / 100), 0);
    return { subtotal, taxes, total: subtotal + taxes, effectiveTaxPct: subtotal > 0 ? ((taxes / subtotal) * 100).toFixed(0) : "5" };
  }, [cart]);

  const clearCart = () => {
    setCart([]);
    setRecentlyAdded([]);
  };

  return { cart, setCart, cartFlash, recentlyAdded, addToCart, updateQuantity, updateNotes, togglePresetNote, removeFromCart, getItemUnitPrice, subtotal, taxes, total, effectiveTaxPct, clearCart };
}
