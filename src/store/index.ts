import { configureStore } from "@reduxjs/toolkit";
import posReducer from "./pos-slice";
import employeeTerminalReducer from "./employee-terminal-slice";
import portalUiReducer from "./portal-ui-slice";

export const store = configureStore({
  reducer: {
    pos: posReducer,
    employeeTerminal: employeeTerminalReducer,
    portalUi: portalUiReducer,
  },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
