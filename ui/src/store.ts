import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cartSlice";
import productsReducer from "./features/productsSlice";
import authReducer from "./features/authSlice";
import appReducer from "./features/appSlice";

// ✅ Factory function for SSR
export function createAppStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      products: productsReducer,
      app: appReducer,
    },
    preloadedState,
  });
}

// ✅ Client-side default store (optional but convenient)
export const store = createAppStore();

// 🔹 Types
export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
