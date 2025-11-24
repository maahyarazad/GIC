import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './features/cartSlice';
import productsReducer from './features/productsSlice';
import authReducer from './features/authSlice';

export const store = configureStore({
  reducer: {
     auth: authReducer,
    cart: cartReducer,
    products: productsReducer,

  },
});

// Infer RootState and AppDispatch types for usage throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
