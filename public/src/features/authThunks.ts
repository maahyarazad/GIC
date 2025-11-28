// features/authThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axiosInstance";

export const checkAuthToken = createAsyncThunk(
  "auth/checkToken",
  async (_, { rejectWithValue }) => {
    

    try {
    
      const res = await axiosInstance.get("/auth/profile");
          debugger;
      return {
        id: res.data.data._id,
        googleId: res.data.data.googleId,
        name: res.data.data.name,
        email: res.data.data.email,
        avatar: res.data.data.avatar,
        createdAt: res.data.data.createdAt,
        role: res.data.data.role
      };

    } catch (err: any) {
      
      debugger;
      return rejectWithValue(err.response?.data?.message || "Invalid token");
    }
  }
);
