// src/api/auth.ts

import axiosInstance from "./axiosInstance"; // adjust path accordingly

export interface LoginModel {
  userName: string;
  userEmail: string;
  password: string;
  rememberMe: boolean;
}

export async function loginUser(loginData: LoginModel) {
  try {
    const response = await axiosInstance.post("/auth/login", loginData);

    return response.data;
  } catch (error) {
    console.error("Failed to log in:", error);
    throw error;
  }
}

export const refreshToken = async () => {
  try {
    const response = await axiosInstance.post("/auth/refresh-token");

    return response.data;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    throw error;
  }
};
