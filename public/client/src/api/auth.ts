// src/api/auth.ts

import axiosInstance from './axiosInstance'; // adjust path accordingly

export interface LoginModel {
  userName: string;
  userEmail: string;
  password: string;
}

export async function loginUser(loginData: LoginModel) {
  try {
    const response = await axiosInstance.post('/auth/login', loginData);
    
    return response.data;
  } catch (error) {
    console.error('Login failed', error);
    throw error;
  }
}
