import type { BulkImportConfig } from "@/components/client/bulk-import-dialog";
import { inventoryService } from "@/services/inventory.service";
import { menuService } from "@/services/menu.service";
import { recipeService } from "@/services/recipe.service";

export const inventoryBulkImportConfig: BulkImportConfig = {
  title: "Bulk Import Inventory Items",
  description: "Upload a CSV or Excel file to add many inventory items at once.",
  actions: {
    templateFileName: "inventory-bulk-template.csv",
    downloadTemplate: (restaurantId) => inventoryService.downloadBulkTemplate(restaurantId),
    validateFile: (file, restaurantId) => inventoryService.validateBulk(file, restaurantId),
    importFile: (file, restaurantId) => inventoryService.importBulk(file, restaurantId),
    downloadErrorReport: (importId) => inventoryService.downloadErrorReport(importId),
  },
  columns: [
    { key: "name", label: "Item Name" },
    { key: "unit", label: "Unit" },
    { key: "currentStock", label: "Stock" },
    {
      key: "costPerUnit",
      label: "Cost/Unit",
      render: (row) => (row.costPerUnit != null ? `₹${row.costPerUnit}` : "—"),
    },
  ],
};

export const menuBulkImportConfig: BulkImportConfig = {
  title: "Bulk Import Menu Items",
  description:
    "Upload a CSV or Excel file. Variants can be Name@Price (e.g. Half@199;Full@349) or a JSON array (e.g. [{\"name\":\"Regular\",\"price\":220}]). Category can be a name or categoryId.",
  actions: {
    templateFileName: "menu-bulk-template.csv",
    downloadTemplate: (restaurantId) => menuService.downloadBulkTemplate(restaurantId),
    validateFile: (file, restaurantId) => menuService.validateBulk(file, restaurantId),
    importFile: (file, restaurantId) => menuService.importBulk(file, restaurantId),
    downloadErrorReport: (importId) => menuService.downloadErrorReport(importId),
  },
  columns: [
    { key: "name", label: "Item Name" },
    { key: "category", label: "Category" },
    { key: "station", label: "Station" },
    {
      key: "variants",
      label: "Variants",
      render: (row) => <span className="whitespace-nowrap">{row.variants || "—"}</span>,
    },
    {
      key: "isVeg",
      label: "Type",
      render: (row) => (row.isVeg == null ? "N/A" : row.isVeg ? "Veg" : "Non-Veg"),
    },
    {
      key: "shortCode",
      label: "Shortcode",
      render: (row) => {
        const parts = [
          row.shortCode ? row.shortCode.toUpperCase() : null,
          row.numericCode ? `#${row.numericCode}` : null,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(" / ") : "—";
      },
    },
  ],
};

export const recipeBulkImportConfig: BulkImportConfig = {
  title: "Bulk Import Recipes / BOM",
  description: "Upload a CSV or Excel file to map menu item variants to inventory ingredients.",
  actions: {
    templateFileName: "recipe-bulk-template.csv",
    downloadTemplate: (restaurantId) => recipeService.downloadBulkTemplate(restaurantId),
    validateFile: (file, restaurantId) => recipeService.validateBulk(file, restaurantId),
    importFile: (file, restaurantId) => recipeService.importBulk(file, restaurantId),
    downloadErrorReport: (importId) => recipeService.downloadErrorReport(importId),
  },
  columns: [
    { key: "name", label: "Menu Item" },
    { key: "variantName", label: "Variant" },
    {
      key: "ingredientCount",
      label: "Ingredients",
      render: (row) => `${row.ingredientCount ?? 0} item(s)`,
    },
  ],
};