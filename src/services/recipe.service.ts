import { apiClient } from "@/lib/api";

export interface RecipeIngredient {
  inventoryItemId: any; // Can be string or populated object
  quantityUsed: number;
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
  getRecipes: async (restaurantId?: string) => {
    const res = await apiClient.get("/recipes", getHeaders(restaurantId));
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
};
