/** Shared key contract for every cashier tab. Keep server state scoped to its restaurant. */
const activeRestaurantId = () => typeof window === "undefined" ? "server" : localStorage.getItem("vinimay_active_restaurant_id") || "assigned";

export const cashierKeys = {
  root: () => ["cashier", activeRestaurantId()] as const,
  orders: (status: "OPEN" | "BILLED" | "PAID") => [...cashierKeys.root(), "orders", status] as const,
  tables: () => [...cashierKeys.root(), "tables"] as const,
  categories: () => [...cashierKeys.root(), "categories"] as const,
  menuItems: () => [...cashierKeys.root(), "menu-items"] as const,
  dues: () => [...cashierKeys.root(), "dues"] as const,
  customerDue: (customerId: string) => [...cashierKeys.dues(), customerId] as const,
  register: (restaurantId: string) => [...cashierKeys.root(), "register", restaurantId] as const,
};
