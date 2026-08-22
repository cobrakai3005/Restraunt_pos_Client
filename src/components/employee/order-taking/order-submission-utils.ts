import { CartItem, Order } from "./types";

export const findOpenOrderForTable = (orders: Order[], tableId: string) =>
  orders.find((order) => {
    if (!order || order.status !== "OPEN") return false;
    const primaryTableId = typeof order.tableId === "object" ? order.tableId?._id : order.tableId;
    const linkedTableIds = Array.isArray(order.tableIds)
      ? order.tableIds.map((table: any) => typeof table === "object" ? table._id : table)
      : [];
    return String(primaryTableId) === String(tableId) || linkedTableIds.includes(String(tableId));
  });

export const customerDetailsPayload = (customerName: string, customerPhone: string, customer: any) =>
  customer || customerName.trim() || customerPhone.trim()
    ? {
        name: customer?.name || customerName.trim() || "Walk-in",
        phone: customer?.phone || customerPhone.trim() || "",
        customerId: customer?._id || null,
      }
    : null;

export const orderIdFromResponse = (response: any) => {
  const data = response?.data || response;
  return data?._id || data?.id || data?.order?._id || null;
};

export const kotPayloadFromCart = (cart: CartItem[]) => ({
  station: cart[0]?.station || "KITCHEN",
  items: cart.map((item) => ({
    menuItemId: item._id,
    variantName: item.selectedVariant.name,
    quantity: item.quantity,
    notes: item.notes || "",
    selectedModifiers: (item.selectedModifiers || []).map((modifier) => ({
      name: modifier.name,
      price: modifier.price,
      groupName: modifier.groupName,
    })),
  })),
});
