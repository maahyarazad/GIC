import { configureStore, PreloadedState } from "@reduxjs/toolkit";
import cartReducer from "./features/cartSlice"; // adjust relative paths if different
import productsReducer from "./features/productsSlice";
import authReducer from "./features/authSlice";

export function createStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      cart: cartReducer,
      products: productsReducer,
    },
    preloadedState,
  });
}

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<ReturnType<typeof createStore>["getState"]>;
export type AppDispatch = ReturnType<typeof createStore>["dispatch"];
