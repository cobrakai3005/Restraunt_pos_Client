"use client";

import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/admin.service";
import { clientService } from "@/services/client.service";
import { menuService } from "@/services/menu.service";
import { vendorService } from "@/services/vendor.service";
import { inventoryService } from "@/services/inventory.service";

export const portalKeys = {
  root: ["portal"] as const,
  clientRestaurants: () => [...portalKeys.root, "client", "restaurants"] as const,
  clientEmployees: (params: { page: number; search?: string; role?: string }) =>
    [...portalKeys.root, "client", "employees", params] as const,
  clientMenuCategories: (restaurantId: string) => [...portalKeys.root, "client", "menu", restaurantId, "categories"] as const,
  clientMenuItems: (restaurantId: string) => [...portalKeys.root, "client", "menu", restaurantId, "items"] as const,
  clientVendors: (restaurantId: string) => [...portalKeys.root, "client", "vendors", restaurantId] as const,
  clientInventory: (params: { restaurantId: string; page: number; search?: string }) =>
    [...portalKeys.root, "client", "inventory", params] as const,
  adminClients: (search: string) => [...portalKeys.root, "admin", "clients", search] as const,
  adminRestaurants: () => [...portalKeys.root, "admin", "restaurants"] as const,
  adminMasterUsers: () => [...portalKeys.root, "admin", "master-users"] as const,
};

const restaurantsFrom = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return response?.data?.restaurants ?? response?.restaurants ?? [];
};

const categoriesFrom = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return response?.data?.categories ?? response?.categories ?? [];
};

export function useClientRestaurants() {
  return useQuery<any[]>({
    queryKey: portalKeys.clientRestaurants(),
    queryFn: async () => restaurantsFrom(await clientService.getRestaurants()),
    staleTime: 60_000,
  });
}

export function useClientEmployees(params: { page: number; limit: number; search?: string; role?: string }) {
  return useQuery<any>({
    queryKey: portalKeys.clientEmployees(params),
    queryFn: async () => clientService.getEmployees(params),
    placeholderData: (previousData: any) => previousData,
  });
}

export function useClientMenuCategories(restaurantId: string) {
  return useQuery<any[]>({
    queryKey: portalKeys.clientMenuCategories(restaurantId),
    queryFn: async () => categoriesFrom(await menuService.getCategories(restaurantId)),
    enabled: Boolean(restaurantId),
  });
}

export function useClientMenuItems(restaurantId: string) {
  return useQuery<any[]>({
    queryKey: portalKeys.clientMenuItems(restaurantId),
    queryFn: async () => {
      const response = await menuService.getMenuItems(restaurantId);
      if (Array.isArray(response)) return response;
      if (Array.isArray(response?.data)) return response.data;
      return response?.data?.menuItems ?? response?.menuItems ?? [];
    },
    enabled: Boolean(restaurantId),
  });
}

export function useClientVendors(restaurantId: string) {
  return useQuery<any[]>({
    queryKey: portalKeys.clientVendors(restaurantId),
    queryFn: async () => {
      const response = await vendorService.getVendors(restaurantId);
      if (Array.isArray(response)) return response;
      if (Array.isArray(response?.data)) return response.data;
      return response?.data?.vendors ?? response?.vendors ?? [];
    },
    enabled: Boolean(restaurantId),
  });
}

export function useClientInventory(params: { restaurantId: string; page: number; limit: number; search?: string }) {
  return useQuery<any>({
    queryKey: portalKeys.clientInventory(params),
    queryFn: () => inventoryService.getInventoryItems(params.restaurantId, {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    }),
    enabled: Boolean(params.restaurantId),
    placeholderData: (previousData: any) => previousData,
  });
}

export function useAdminClients(search: string) {
  return useQuery<any>({
    queryKey: portalKeys.adminClients(search),
    queryFn: () => adminService.getAllClients(search || undefined),
    placeholderData: (previousData: any) => previousData,
  });
}

export function useAdminRestaurants() {
  return useQuery<any>({
    queryKey: portalKeys.adminRestaurants(),
    queryFn: () => adminService.getAllRestaurants(),
    staleTime: 30_000,
  });
}

export function useAdminMasterUsers() {
  return useQuery<any>({
    queryKey: portalKeys.adminMasterUsers(),
    queryFn: () => adminService.getAllMasterUsers(),
    staleTime: 30_000,
  });
}
