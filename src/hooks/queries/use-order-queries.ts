import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeService } from "@/services/employee.service";
import { cashierKeys } from "./cashier-keys";

const list = (response: any, key: string) => response?.data?.[key] || response?.data || [];

export function useOrderTerminalData() {
  const categories = useQuery({ queryKey: cashierKeys.categories(), queryFn: employeeService.getCategories });
  const menuItems = useQuery({ queryKey: cashierKeys.menuItems(), queryFn: employeeService.getMenuItems });
  const tables = useQuery({ queryKey: cashierKeys.tables(), queryFn: employeeService.getTables });
  const openOrders = useQuery({ queryKey: cashierKeys.orders("OPEN"), queryFn: () => employeeService.getOrders({ status: "OPEN", limit: 100 }) });
  const refetchOrders = () => openOrders.refetch();
  return { categories: list(categories.data, "categories"), menuItems: list(menuItems.data, "menuItems"), tables: list(tables.data, "tables"), activeOrders: list(openOrders.data, "orders"), isLoading: categories.isLoading || menuItems.isLoading || tables.isLoading || openOrders.isLoading, refetchOrders, refetchTables: tables.refetch };
}

export function useOrderTerminalMutations() {
  const queryClient = useQueryClient();
  const refreshOrders = () => queryClient.invalidateQueries({ queryKey: cashierKeys.orders("OPEN") });
  const refreshFloor = () => Promise.all([refreshOrders(), queryClient.invalidateQueries({ queryKey: cashierKeys.tables() })]);
  return {
    createOrder: useMutation({ mutationFn: employeeService.createOrder, onSuccess: refreshFloor }),
    addKot: useMutation({ mutationFn: ({ orderId, data }: { orderId: string; data: any }) => employeeService.addKot(orderId, data), onSuccess: refreshOrders }),
    updateCustomer: useMutation({ mutationFn: ({ orderId, data }: { orderId: string; data: any }) => employeeService.updateCustomer(orderId, data), onSuccess: refreshOrders }),
  };
}
