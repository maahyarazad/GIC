// src/api/client.ts
import axiosInstance from './axiosInstance'; // adjust path accordingly



/**
 * Update a client JSON document by its ID
 */
export async function updateClientById(id: string, updatedJson: any) {
  try {
    
    const response = await axiosInstance.put(`/client/${id}`, updatedJson);
    return response.data; // assuming your API wraps in success/error response
  } catch (err: any) {
    console.error('Failed to update client', err);
    throw err;
  }
}
