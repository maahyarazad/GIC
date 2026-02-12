// src/api/auth.ts
import axiosInstance from "./axiosInstance";
import { UpdateUserRequest } from "../../../src/types/user.types";
import { NewsletterSubscriber } from "../../../src/types/newsletterSubscriber.types";

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
    console.error("Update user failed", error);
    throw error;
  }
}

/**
 * Update user by ID
 * @param id - User ID
 */
export async function getLogs(id: string) {
  try {
    const response = await axiosInstance.get(`/logs/${id}`);

    return response.data;
  } catch (error) {
    console.error("Update user failed", error);
    throw error;
  }
}

/**
 * Update user by ID
 * @param id - User ID
 * @param updateData - Fields to update
 */

export async function updateUserProfile(
  id: string,
  updateData: UpdateUserRequest
) {
  try {
    const response = await axiosInstance.put(
      `/users/user-profile/${id}`,
      updateData
    );
    return response.data;
  } catch (error) {
    console.error("Update user failed", error);
    throw error;
  }
}

/**
 * Get user by ID
 * @param id - User ID
 
 */

export async function getUserProfile(id: string) {
  try {
    const response = await axiosInstance.get(`/users/user-profile/${id}`);
    return response.data;
  } catch (error) {
    console.error("Update user failed", error);
    throw error;
  }
}

export interface PDFResponse {
  blob: Blob;
  filename: string;
}

/**
 * Fetch PDF blob by ID along with filename from response headers
 * 
 * @returns object with Blob and filename string
 */
export async function getPDFBlob(fileId: string): Promise<PDFResponse> {
  const response = await axiosInstance.get(`/watermark/`, {
    responseType: "arraybuffer",
    transformResponse: [(data) => data],
  });
  const blob = new Blob([response.data], {
      type: "application/pdf",
    });
    
    const disposition = response.headers["content-disposition"];
    debugger;
    
    let filename = "";
    
  if (disposition) {
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }
  }

  return { blob, filename };
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
    console.error("Upload user photo failed", error);
    throw error;
  }
}

/**
 * Check Newsletter Subscription Status
 * @param email - User ID
 
 */
export async function upsertNewsletterSubscriber(
  email: string,
  body: Partial<NewsletterSubscriber>
) {
  try {
    const response = await axiosInstance.put(`/newsletter/${email}`, body);

    return response.data;
  } catch (error) {
    console.error("Upload user photo failed", error);
    throw error;
  }
}

/**
 * Check Newsletter Subscription Status
 * @param id - User ID
 
 */

export async function getUserData(id: string) {
  try {
    const response = await axiosInstance.get(`/users/${id}`);

    return response.data;
  } catch (error) {
    console.error("Upload user photo failed", error);
    throw error;
  }
}

/**
 * Upload user profile photo
 * @param id - User ID
 * @param file - Photo file to upload
 */
export async function uploadUserPhoto(
  userId: string,
  photoFile: File
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    const formData = new FormData();
    formData.append("file", photoFile);

    const response = await axiosInstance.post(
      `/users/${userId}/upload-photo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true, // if using cookies/auth
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("uploadUserPhoto error:", error);
    return {
      success: false,
      message:
        error?.response?.data?.message || error.message || "Upload failed",
    };
  }
}
