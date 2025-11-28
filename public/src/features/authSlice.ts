import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { checkAuthToken } from './authThunks';
import {User} from '../../../src/types/user.types'

interface UserProfile {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string; // or Date if the API returns a Date object
  role: string;
};
interface AuthState {
  user: User | null;
  loading: boolean;
  error?: string;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: undefined,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.error = undefined;
      state.loading = false;
    },
    login(state, action: PayloadAction<any>){
        state.user = action.payload
        state.loading = false;
    },
    setLoadingTrue(state) {
      state.loading = true;
    },
    setLoadingFalse(state) {
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuthToken.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(checkAuthToken.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        // here I need to check the path it is login than I need to redirect the user to main page

        state.user = action.payload;
        state.loading = false;
      })
      .addCase(checkAuthToken.rejected, (state, action) => {
        
        state.user = null;
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, login, setLoadingTrue, setLoadingFalse } = authSlice.actions;
export default authSlice.reducer;
