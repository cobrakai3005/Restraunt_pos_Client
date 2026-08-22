import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PortalUiState = {
  clientSelectedRestaurantId: string;
  adminClientsView: "cards" | "list";
  adminUsersView: "grid" | "table";
};

const initialState: PortalUiState = {
  clientSelectedRestaurantId: "",
  adminClientsView: "cards",
  adminUsersView: "table",
};

const portalUiSlice = createSlice({
  name: "portalUi",
  initialState,
  reducers: {
    setClientSelectedRestaurantId: (state, action: PayloadAction<string>) => {
      state.clientSelectedRestaurantId = action.payload;
    },
    setAdminClientsView: (state, action: PayloadAction<PortalUiState["adminClientsView"]>) => {
      state.adminClientsView = action.payload;
    },
    setAdminUsersView: (state, action: PayloadAction<PortalUiState["adminUsersView"]>) => {
      state.adminUsersView = action.payload;
    },
    resetPortalUi: () => initialState,
  },
});

export const {
  setClientSelectedRestaurantId,
  setAdminClientsView,
  setAdminUsersView,
  resetPortalUi,
} = portalUiSlice.actions;

export default portalUiSlice.reducer;
