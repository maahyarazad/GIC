import axiosInstance, { ApiError } from "./axiosInstance";

export const apiErrorMessage = (error: unknown, fallback: string): string =>
  (error as ApiError)?.message || (error as Error)?.message || fallback;

/**
 * Upload one file to the File Manager, reporting bytes sent as the server receives them.
 * Resolves with the stored file's id; rejects when the request fails or the API reports
 * `success: false` (e.g. an unsupported file type).
 */
export const uploadFile = async (
  file: File,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<{ fileId: string; extension: string }> => {
  const form = new FormData();
  form.append("file", file);

  const response = await axiosInstance.post("/files", form, {
    signal,
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      onProgress?.(event.loaded, event.total ?? file.size);
    },
  });

  if (!response.data?.success) {
    throw new Error(response.data?.message || "Upload failed");
  }
  return response.data.data;
};
