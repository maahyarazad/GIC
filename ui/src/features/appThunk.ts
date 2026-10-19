// features/appThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSiteData } from "../api/axiosInstance";

export const loadSiteData = createAsyncThunk(
  "app/loadSiteData",
  async (language: string, { rejectWithValue }) => {
    try {
      return await fetchSiteData(language);
    } catch (err: any) {
      console.error("Failed to load site data:", err);
      return rejectWithValue(err.response?.data?.message || "Failed to load site data");
    }
  }
);
