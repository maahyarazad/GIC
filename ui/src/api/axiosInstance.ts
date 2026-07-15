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
//  Normalize backend API errors
// --------------------------
function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    let data = error.response?.data;

    // If data is ArrayBuffer, decode it
    if (data instanceof ArrayBuffer) {
      try {
        const decoder = new TextDecoder("utf-8");
        const text = decoder.decode(data);
        data = JSON.parse(text); // Try to parse JSON
      } catch (e) {
        // fallback: just use the raw text
        data = { message: `Failed to parse error: ${e}, raw data: ${data}` };
      }
    }

    if (data && typeof data === "object") {
      return {
        success: false,
        message: data.message ?? "Unknown API error",
        error: {
          message: data.error?.message ?? "Unknown error",
          code: data.error?.code ?? error.code ?? "ERR_UNKNOWN",
          details: data.error?.details,
        },
        timestamp: data.timestamp ?? new Date().toISOString(),
      };
    }

    // If data is not object even after decoding
    return {
      success: false,
      message: "Unknown API error",
      error: {
        message: error.message,
        code: error.code ?? "ERR_UNKNOWN",
        details: null,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Fallback for non-Axios errors
  return {
    success: false,
    message: "Unknown error",
    error: {
      message: (error as Error)?.message ?? "No message",
      code: "ERR_UNKNOWN",
      details: null,
    },
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

    // When the access token has expired and could not be refreshed on the
    // server (no valid refresh token), send the user back to the login page.
    if (
      normalized.error.code === "TOKEN_EXPIRED" &&
      typeof window !== "undefined" &&
      window.location.pathname !== "/login"
    ) {
      window.location.href = "/login";
    }

    return Promise.reject(normalized);
  }
);


export async function fetchSiteData(env?: string) {
    
    //@ts-ignore
  const res = await fetch(`${env.VITE_SERVER_API_URL}/api/v1/client`, {
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": "english",
    },
    credentials: "include",
  });

  
  if (!res.ok) {
    throw new Error(`fetchSiteData failed: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export default axiosInstance;
