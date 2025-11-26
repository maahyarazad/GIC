/* ============================================================
   API RESPONSE WRAPPERS
   ============================================================ */

export type SuccessResponse<T> = {
    success: true;
    message?: string;
    data: T;
    timestamp: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
};

export type ErrorResponse = {
    success: false;
    message: string;
    error: {
        message: string;
        code?: string;
        details?: any;
    };
    timestamp: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/* ============================================================
   VOYAGE AI RESPONSE  vector storage in MongoDB / Atlas Vector Search
   ============================================================ */

export interface VoyageAIResponse {
    data: Array<{
        embedding: number[];
    }>;
}


export function createSuccessResponse<T>(
  data: T,
  message?: string,
  pagination?: any
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
    ...(pagination ? { pagination } : {}),
  };
}

export function createErrorResponse(
  message: string,
  code?: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    message,
    error: { message, code, details },
    timestamp: new Date().toISOString(),
  };
}

// Utility for required fields
export function validateRequiredFields(obj: any, fields: string[]): string[] {
    const missing: string[] = [];
    for (const field of fields) {
        if (
            obj[field] === undefined ||
            obj[field] === null ||
            (typeof obj[field] === "string" && obj[field].trim() === "")
        ) {
            missing.push(field);
        }
    }
    return missing;
}



/** ASC or DESC */
export type SortOrder = "asc" | "desc";

/** Generic MongoDB sort type */
export type Sort<T = any> = {
    [K in keyof T]?: 1 | -1;
};


export function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface FilterModel<T> {
    field: keyof T;
    operator: "contains" | "equals" | "startsWith" | "endsWith"; // extend as needed
    value: string | number;
}
