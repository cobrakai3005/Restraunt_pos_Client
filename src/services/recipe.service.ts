import { apiClient } from "@/lib/api";

export interface RecipeIngredient {
  inventoryItemId: any; // Can be string or populated object
  quantityUsed: number;
  unit?: string;
}

export interface Recipe {
  _id: string;
  restaurantId: string;
  menuItemId: any; // Can be string or populated object
  variantName: string;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

const getHeaders = (restaurantId?: string) => {
  return restaurantId ? { headers: { "x-restaurant-id": restaurantId } } : {};
};

export const recipeService = {
  getRecipes: async (restaurantId?: string, params?: Record<string, any>) => {
    const res = await apiClient.get("/recipes", { ...getHeaders(restaurantId), params });
    return res.data;
  },

  getRecipeById: async (id: string, restaurantId?: string) => {
    const res = await apiClient.get(`/recipes/${id}`, getHeaders(restaurantId));
    return res.data;
  },

  createRecipe: async (data: Partial<Recipe>, restaurantId?: string) => {
    const res = await apiClient.post("/recipes", data, getHeaders(restaurantId));
    return res.data;
  },

  updateRecipe: async (id: string, data: Partial<Recipe>, restaurantId?: string) => {
    // Note: The backend uses PATCH for update Recipe
    const res = await apiClient.patch(`/recipes/${id}`, data, getHeaders(restaurantId));
    return res.data;
  },

  deleteRecipe: async (id: string, restaurantId?: string) => {
    const res = await apiClient.delete(`/recipes/${id}`, getHeaders(restaurantId));
    return res.data;
  },

  // --- BULK IMPORT ---
  downloadBulkTemplate: async (restaurantId?: string): Promise<Blob> => {
    const res = await apiClient.get("/recipes/bulk/template", { responseType: "blob", ...getHeaders(restaurantId) });
    return res.data;
  },

  validateBulk: async (file: File, restaurantId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/recipes/bulk/validate", formData, getHeaders(restaurantId));
    return res.data;
  },

  importBulk: async (file: File, restaurantId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await apiClient.post("/recipes/bulk/import", formData, getHeaders(restaurantId));
    return res.data;
  },

  downloadErrorReport: async (importId: string): Promise<Blob> => {
    const res = await apiClient.get(`/recipes/bulk/error-report/${importId}`, {
      responseType: "blob",
    });
    return res.data;
  },
};
