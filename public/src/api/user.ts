// src/api/auth.ts
import axiosInstance from './axiosInstance'; // adjust path accordingly
import { UpdateUserRequest } from '../../../src/types/user.types';

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

/**
 * Upload user profile photo
 * @param id - User ID
 * @param file - Photo file to upload
 */
export async function uploadUserPhoto(id: string, file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(`/users/${id}/upload-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Upload user photo failed', error);
    throw error;
  }


  
}


/**
 * Check Newsletter Subscription Status
 * @param email - User ID
 
 */
export async function checkNewsLetter(email: string) {
  try {
    

    const response = await axiosInstance.get(`/newsletter/email/${email}`);

    return response.data;
  } catch (error) {
    console.error('Upload user photo failed', error);
    throw error;
  }
}


/**
 * Check Newsletter Subscription Status
 * @param id - User ID
 
 */

export async function getUserData(id: string) {
  try {
    

    const response = await axiosInstance.get(`/user/${id}`);

    return response.data;
  } catch (error) {
    console.error('Upload user photo failed', error);
    throw error;
  }
}


