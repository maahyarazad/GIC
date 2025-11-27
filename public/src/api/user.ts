// src/api/auth.ts
import axiosInstance from './axiosInstance'; // adjust path accordingly

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: "user" | "admin"
  authorize?: boolean;
}

/**
 * Update user by ID
 * @param id - User ID
 * @param updateData - Fields to update
 */
export async function updateUser(id: string, updateData: UpdateUserRequest) {
  try {
    const response = await axiosInstance.put(`/users/${id}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Update user failed', error);
    throw error;
  }
}
