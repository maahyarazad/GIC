import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchSiteData } from "../api/axiosInstance";

interface AppState {
  isReady: boolean;
  siteData: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: AppState = {
  isReady: false,
  siteData: null,
  loading: false,
  error: null,
};

// ✅ Async thunk (client-side usage)
export const loadSiteData = createAsyncThunk(
  "app/loadSiteData",
  async (language: string, { rejectWithValue }) => {
    try {
      return await fetchSiteData(language);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load site data"
      );
    }
  }
);

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setReady(state, action: PayloadAction<boolean>) {
      state.isReady = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSiteData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadSiteData.fulfilled, (state, action) => {
        state.loading = false;
        state.siteData = action.payload;
      })
      .addCase(loadSiteData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setReady } = appSlice.actions;
export default appSlice.reducer;
