import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type PosState = {
  activeRestaurantId: string | null;
  selectedTableId: string | null;
  orderType: "DINE_IN" | "TAKEAWAY";
  registerSessionId: string | null;
  socketConnected: boolean;
};
const initialState: PosState = { activeRestaurantId: null, selectedTableId: null, orderType: "DINE_IN", registerSessionId: null, socketConnected: false };
const posSlice = createSlice({
  name: "pos", initialState,
  reducers: {
    setActiveRestaurantId: (state, action: PayloadAction<string | null>) => { state.activeRestaurantId = action.payload; },
    setSelectedTableId: (state, action: PayloadAction<string | null>) => { state.selectedTableId = action.payload; },
    setOrderType: (state, action: PayloadAction<PosState["orderType"]>) => { state.orderType = action.payload; },
    setRegisterSessionId: (state, action: PayloadAction<string | null>) => { state.registerSessionId = action.payload; },
    setSocketConnected: (state, action: PayloadAction<boolean>) => { state.socketConnected = action.payload; },
    resetPosSession: () => initialState,
  },
});
export const { setActiveRestaurantId, setSelectedTableId, setOrderType, setRegisterSessionId, setSocketConnected, resetPosSession } = posSlice.actions;
export default posSlice.reducer;
