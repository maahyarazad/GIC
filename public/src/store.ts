// import { configureStore } from '@reduxjs/toolkit';
// import cartReducer from './features/cartSlice';
// import productsReducer from './features/productsSlice';
// import authReducer from './features/authSlice';

// export const store = configureStore({
//   reducer: {
//      auth: authReducer,
//     cart: cartReducer,
//     products: productsReducer,

//   },
// });

// // Infer RootState and AppDispatch types for usage throughout the app
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;


import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cartSlice";
import productsReducer from "./features/productsSlice";
import authReducer from "./features/authSlice";
import { PreloadedState } from "@reduxjs/toolkit";

// Type for the root state
export type RootState = {
  auth: ReturnType<typeof authReducer>;
  cart: ReturnType<typeof cartReducer>;
  products: ReturnType<typeof productsReducer>;
};

// Type for dispatch
export type AppDispatch = typeof store.dispatch;

// Grab preloaded state injected by server (if any)
const preloaded: PreloadedState<RootState> = (window as any).__PRELOADED_STATE__ || {};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productsReducer,
  },
  preloadedState: preloaded,
});
