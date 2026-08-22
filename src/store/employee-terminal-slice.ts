import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CashierTerminalMode = "orders" | "kitchen" | "billing" | "receivables" | "reports";

type EmployeeTerminalState = {
  cashierMode: CashierTerminalMode;
  managerTab: string;
  navigationDrawerOpen: boolean;
};

const initialState: EmployeeTerminalState = {
  cashierMode: "orders",
  managerTab: "floor",
  navigationDrawerOpen: false,
};

const employeeTerminalSlice = createSlice({
  name: "employeeTerminal",
  initialState,
  reducers: {
    setCashierMode: (state, action: PayloadAction<CashierTerminalMode>) => { state.cashierMode = action.payload; },
    setManagerTab: (state, action: PayloadAction<string>) => { state.managerTab = action.payload; },
    setNavigationDrawerOpen: (state, action: PayloadAction<boolean>) => { state.navigationDrawerOpen = action.payload; },
    resetEmployeeTerminal: () => initialState,
  },
});

export const { setCashierMode, setManagerTab, setNavigationDrawerOpen, resetEmployeeTerminal } = employeeTerminalSlice.actions;
export default employeeTerminalSlice.reducer;
