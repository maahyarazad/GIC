import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchSiteData } from "../api/axiosInstance";

interface AppState {
  isReady: boolean;
  siteData: any | null;
  loading: boolean;
  error: string | null;
  env: string | null;
  /** Dashboard sidebar open below the navbar breakpoint; toggled by the navbar hamburger. */
  dashboardSidebarOpen: boolean;
}

const initialState: AppState = {
  isReady: false,
  siteData: null,
  loading: false,
  error: null,
  env: null,
  dashboardSidebarOpen: false,
};

// ✅ Async thunk (client-side usage)
export const loadSiteData = createAsyncThunk(
  "app/loadSiteData",
  async (language: string, { rejectWithValue }) => {
    try {
      return await fetchSiteData(language);
    } catch (err: any) {
      console.error("Failed to load site data:", err);
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
    setDashboardSidebarOpen(state, action: PayloadAction<boolean>) {
      state.dashboardSidebarOpen = action.payload;
    },
    toggleDashboardSidebar(state) {
      state.dashboardSidebarOpen = !state.dashboardSidebarOpen;
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

export const { setReady, setDashboardSidebarOpen, toggleDashboardSidebar } = appSlice.actions;
export default appSlice.reducer;
