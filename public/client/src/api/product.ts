// src/api/auth.ts

import axiosInstance from './axiosInstance'; // adjust path accordingly

import {CreateProductRequest}from '../../../src/types/product.types'


export async function createProduct(productData: CreateProductRequest) {
  try {

    const response = await axiosInstance.post("/products", productData);
            
    return response.data;
  } catch (error) {
    console.error("Failed to create product:", error);
   return error;
  }
}


export async function deleteProduct(id: string) {
  try {

    const response = await axiosInstance.delete(`/products/${id}`);
        
    return response.data;
  } catch (error) {
    console.error("Failed to delete product:", error);
   return error;
  }
}