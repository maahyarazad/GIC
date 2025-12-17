import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// --------------------------
// 🎯 ApiError Interface
// --------------------------
export interface ApiError {
  success: false;
  message: string;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

// --------------------------
// 🎯 Normalize backend API errors
// --------------------------
function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data && typeof data === "object") {
      return {
        success: false,
        message: data.message ?? "Unknown API error",
        error: {
          message: data.error?.message ?? "Unknown error",
          code: data.error?.code,
          details: data.error?.details,
        },
        timestamp: data.timestamp ?? new Date().toISOString(),
      };
    }
  }

  return {
    success: false,
    message: error instanceof Error ? error.message : "Unexpected error",
    error: { message: "Unexpected error" },
    timestamp: new Date().toISOString(),
  };
}

// --------------------------
// 📌 Create Axios Instance
// --------------------------

const axiosInstance = axios.create({
  
  baseURL: `/api/v1/`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// --------------------------
// 📌 Request Interceptor (typed)
// --------------------------
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add token if needed
    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------
// ❗ Response Error Interceptor (typed)
// --------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError | unknown) => {
    const normalized = normalizeApiError(error);
    return Promise.reject(normalized);
  }
);

export default axiosInstance;
