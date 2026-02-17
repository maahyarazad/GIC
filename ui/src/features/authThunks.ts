// features/authThunks.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axiosInstance";
import {refreshToken} from '../api/auth';

export const checkAuthToken = createAsyncThunk(
  "auth/checkToken",
  async (_, { rejectWithValue }) => {
    

    try {
        
        refreshToken();

        
      const res = await axiosInstance.get("/auth/profile");
      return {
        id: res.data.data._id,
        googleId: res.data.data.googleId,
        name: res.data.data.name,
        phone: res.data.data.phone,
        email: res.data.data.email,
        avatar: res.data.data.avatar,
        createdAt: res.data.data.createdAt,
        role: res.data.data.role
      };

    } catch (err: any) {
      
      
      return rejectWithValue(err.response?.data?.message || "Invalid token");
    }
  }
);



